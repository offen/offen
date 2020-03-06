package main

import (
	"context"
	"encoding/base64"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	uuid "github.com/gofrs/uuid"
	"github.com/jinzhu/gorm"
	"github.com/microcosm-cc/bluemonday"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/locales"
	"github.com/offen/offen/server/persistence"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/public"
	"github.com/offen/offen/server/router"
	"github.com/phayes/freeport"
	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/acme/autocert"
	"golang.org/x/crypto/ssh/terminal"
	yaml "gopkg.in/yaml.v2"
)

func main() {
	logger := logrus.New()

	var mustConfig = func(populateMissing bool, override string) *config.Config {
		cfg, cfgErr := config.New(populateMissing, override)
		if cfgErr != nil {
			if errors.Is(cfgErr, config.ErrPopulatedMissing) {
				logger.Infof("Some configuration values were missing: %v", cfgErr.Error())
			} else {
				logger.WithError(cfgErr).Fatal("Error sourcing runtime configuration")
			}
		}
		logger.SetLevel(cfg.App.LogLevel.LogLevel())
		if !cfg.SMTPConfigured() {
			logger.Warn("SMTP for transactional email is not configured right now, mail delivery will be unreliable")
			logger.Warn("Refer to the documentation to find out how to configure SMTP")
		}
		return cfg
	}

	secretCmd := flag.NewFlagSet("secret", flag.ExitOnError)
	setupCmd := flag.NewFlagSet("setup", flag.ExitOnError)
	demoCmd := flag.NewFlagSet("demo", flag.ExitOnError)
	serveCmd := flag.NewFlagSet("serve", flag.ExitOnError)
	migrateCmd := flag.NewFlagSet("migrate", flag.ExitOnError)
	expireCmd := flag.NewFlagSet("expire", flag.ExitOnError)
	debugCmd := flag.NewFlagSet("debug", flag.ExitOnError)

	subcommand := "serve"
	isAliasCommand := false
	var flags []string
	if len(os.Args) > 1 {
		subcommand = os.Args[1]
		flags = os.Args[2:]
	}
	if strings.HasPrefix(subcommand, "-") {
		subcommand = "serve"
		flags = os.Args[1:]
		isAliasCommand = true
	}

	switch subcommand {
	case "demo":
		demoCmd.Usage = func() {
			fmt.Fprint(
				flag.CommandLine.Output(), `
"demo" starts a one-off Offen instance that you can use for testing the software.
You can use the username "demo@offen.dev" with password "demo" to log in.

By default, a random available port will be picked for running the server.
If you need to override this, pass a value to -port.

Usage of "demo":
`)
			demoCmd.PrintDefaults()
		}
		var (
			port = demoCmd.Int("port", 0, "the port to bind to (defaults to a random available port)")
		)
		demoCmd.Parse(flags)

		cfg, _ := config.New(false, "")
		cfg.Database.Dialect = config.Dialect("sqlite3")
		cfg.Database.ConnectionString = ":memory:"
		cfg.Secrets.CookieExchange = mustSecret(16)

		if *port == 0 {
			freePort, portErr := freeport.GetFreePort()
			if portErr != nil {
				logger.WithError(portErr).Fatal("Unable to allocate free port to run demo")
			}
			*port = freePort
		}
		cfg.Server.Port = *port

		accountID, err := uuid.NewV4()
		if err != nil {
			logger.WithError(err).Fatal("Unable to create random account identifier")
		}
		cfg.App.RootAccount = accountID.String()

		gormDB, err := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString.String())
		if err != nil {
			logger.WithError(err).Fatal("Unable to establish database connection")
		}
		gormDB.LogMode(cfg.App.Development)

		db, err := persistence.New(
			relational.NewRelationalDAL(gormDB),
		)
		if err != nil {
			logger.WithError(err).Fatal("Unable to create persistence layer")
		}

		if err := db.Migrate(); err != nil {
			logger.WithError(err).Fatal("Error applying initial database migrations")
		}
		if err := db.Bootstrap(persistence.BootstrapConfig{
			Accounts: []persistence.BootstrapAccount{
				{AccountID: cfg.App.RootAccount, Name: "Demo Account"},
			},
			AccountUsers: []persistence.BootstrapAccountUser{
				{Email: "demo@offen.dev", Password: "demo", Accounts: []string{cfg.App.RootAccount}},
			},
		}); err != nil {
			logger.WithError(err).Fatal("Error bootstrapping database")
		}

		fs := public.NewLocalizedFS(cfg.App.Locale.String())

		gettext, gettextErr := locales.GettextFor(cfg.App.Locale.String())
		if gettextErr != nil {
			logger.WithError(gettextErr).Fatal("Failed reading locale files, cannot continue")
		}

		tpl, tplErr := public.HTMLTemplate(gettext, public.RevWith(fs))
		if tplErr != nil {
			logger.WithError(tplErr).Fatal("Failed parsing template files, cannot continue")
		}

		srv := &http.Server{
			Addr: fmt.Sprintf("0.0.0.0:%d", cfg.Server.Port),
			Handler: router.New(
				router.WithDatabase(db),
				router.WithLogger(logger),
				router.WithTemplate(tpl),
				router.WithConfig(cfg),
				router.WithFS(fs),
				router.WithMailer(cfg.NewMailer()),
			),
		}
		go func() {
			if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				logger.WithError(err).Fatal("Error binding server to network")
			}
		}()
		logger.Infof("Demo application now serving http://localhost:%d", cfg.Server.Port)
		logger.Info(`You can log into the demo account using "demo@offen.dev" and password "demo"`)
		logger.Info("Data is stored in-memory only for this demo.")
		logger.Info("Refer to the documentation on how to connect a persistent database.")

		quit := make(chan os.Signal)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			logger.WithError(err).Fatal("Error shutting down server")
		}

		logger.Info("Gracefully shut down server")
	case "serve":
		serveCmd.Usage = func() {
			if isAliasCommand {
				fmt.Fprint(
					flag.CommandLine.Output(), `
"offen" makes the following subcommands available:

- "serve" runs the application (this will also run when not providing a subcommand)
- "setup" can be used to setup a new instance
- "secret" can be used to generate runtime secrets
- "demo" starts an ephemeral instance for testing
- "expire" prunes expired events from the database
- "migrate" applies pending database migrations
- "debug" prints the currently applied configuration values

Refer to the -help content of each subcommand for information about how to use
them. Further documentation is available at
https://docs.offen.dev/running-offen/using-the-command/
`)
				return
			}
			fmt.Fprint(
				flag.CommandLine.Output(), `
"serve" starts the Offen instance and listens to the configured ports.
Configuration is sourced either from the envfile given to -envfile or a file
called offen.env in the default lookup hierarchy (this applies to Linux and
Darwin only):

- In the current working directory
- In ~/.config
- In $XDG_CONFIG_HOME
- In /etc/offen

In case no envfile is found or given, the environment variables already set are
used. More documentation about configuration Offen can be found at:
https://docs.offen.dev/running-offen/configuring-the-application/

Usage of "serve":
`)
			serveCmd.PrintDefaults()
		}
		var (
			envFile = serveCmd.String("envfile", "", "the env file to use")
		)
		serveCmd.Parse(flags)
		cfg := mustConfig(false, *envFile)

		gormDB, err := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString.String())
		if err != nil {
			logger.WithError(err).Fatal("Unable to establish database connection")
		}
		gormDB.LogMode(cfg.App.Development)

		db, err := persistence.New(
			relational.NewRelationalDAL(gormDB),
		)
		if err != nil {
			logger.WithError(err).Fatal("Unable to create persistence layer")
		}

		if cfg.App.SingleNode {
			if err := db.Migrate(); err != nil {
				logger.WithError(err).Fatal("Error applying database migrations")
			} else {
				logger.Info("Successfully applied database migrations")
			}
		}

		fs := public.NewLocalizedFS(cfg.App.Locale.String())
		gettext, gettextErr := locales.GettextFor(cfg.App.Locale.String())
		if gettextErr != nil {
			logger.WithError(gettextErr).Fatal("Failed reading locale files, cannot continue")
		}
		tpl, tplErr := public.HTMLTemplate(gettext, public.RevWith(fs))
		if tplErr != nil {
			logger.WithError(tplErr).Fatal("Failed parsing template files, cannot continue")
		}

		srv := &http.Server{
			Addr: fmt.Sprintf("0.0.0.0:%d", cfg.Server.Port),
			Handler: router.New(
				router.WithDatabase(db),
				router.WithLogger(logger),
				router.WithTemplate(tpl),
				router.WithConfig(cfg),
				router.WithFS(fs),
				router.WithMailer(cfg.NewMailer()),
			),
		}
		go func() {
			if cfg.Server.SSLCertificate != "" && cfg.Server.SSLKey != "" {
				err := srv.ListenAndServeTLS(cfg.Server.SSLCertificate.String(), cfg.Server.SSLKey.String())
				if err != nil && err != http.ErrServerClosed {
					logger.WithError(err).Fatal("Error binding server to network")
				}
			} else if len(cfg.Server.AutoTLS) != 0 {
				m := autocert.Manager{
					Prompt:     autocert.AcceptTOS,
					HostPolicy: autocert.HostWhitelist(cfg.Server.AutoTLS...),
					Cache:      autocert.DirCache(cfg.Server.CertificateCache),
				}
				go http.ListenAndServe(":http", m.HTTPHandler(nil))
				if err := http.Serve(m.Listener(), srv.Handler); err != nil && err != http.ErrServerClosed {
					logger.WithError(err).Fatal("Error binding server to network")
				}
			} else {
				if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
					logger.WithError(err).Fatal("Error binding server to network")
				}
			}
		}()
		if len(cfg.Server.AutoTLS) != 0 {
			logger.Info("Server now listening on port 80 and 443 using AutoTLS")
		} else {
			logger.Infof("Server now listening on port %d", cfg.Server.Port)
		}

		if cfg.App.SingleNode {
			hourlyJob := time.Tick(time.Hour)
			runOnInit := make(chan bool)
			go func() {
				for {
					select {
					case <-hourlyJob:
					case <-runOnInit:
					}
					affected, err := db.Expire(config.EventRetention)
					if err != nil {
						logger.WithError(err).Errorf("Error pruning expired events")
						return
					}
					logger.WithField("removed", affected).Info("Cron successfully pruned expired events")
				}
			}()
			runOnInit <- true
		}

		quit := make(chan os.Signal)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			logger.WithError(err).Fatal("Error shutting down server")
		}

		logger.Info("Gracefully shut down server")
	case "setup":
		setupCmd.Usage = func() {
			fmt.Fprint(
				flag.CommandLine.Output(), `
"setup" is used to populate a fresh Offen instance with user(s) and account(s).
In the most basic case, you are likely going to create a single user and an
account and then will use the UI to add more users create additional accounts.

A basic example for setting up a new instance looks like:

$ ./offen setup -name "My New Account" -email me@mydomain.org -populate

The command will then prompt for a password to use. Passing -populate will
create potentially missing secrets in your envfile. Do not pass the flag if you
want to do this yourself.

If you do not want to use the CLI, you can also create an initial account and
user by visting "/setup/" in your browser while the Offen instance is running.

Usage of "setup":
`)
			setupCmd.PrintDefaults()
		}
		var (
			accountName     = setupCmd.String("name", "", "the account name")
			email           = setupCmd.String("email", "", "the email address used for login")
			accountID       = setupCmd.String("forceid", "", "force usage of given valid UUID as account ID")
			password        = setupCmd.String("password", "", "the password used for login")
			source          = setupCmd.String("source", "", "a configuration file")
			envFile         = setupCmd.String("envfile", "", "the env file to use")
			force           = setupCmd.Bool("force", false, "allow setup to delete existing data")
			populateMissing = setupCmd.Bool("populate", false, "in case required secrets are missing from the configuration, create and persist them in the target env file")
		)
		setupCmd.Parse(flags)
		sanitizer := bluemonday.StrictPolicy()

		pw := *password
		if *source == "" && pw == "" {
			received := make(chan bool, 2)
			go func() {
				select {
				case <-received:
					return
				case <-time.Tick(time.Second / 10):
					logger.Info("You can now enter your password (input is not displayed):")
				}
			}()
			input, inputErr := terminal.ReadPassword(int(os.Stdin.Fd()))
			if inputErr != nil {
				logger.WithError(inputErr).Fatal("Error reading password")
			}
			pw = string(input)
		}

		cfg := mustConfig(*populateMissing, *envFile)
		conf := persistence.BootstrapConfig{}
		if *source != "" {
			logger.Infof("Trying to read account seed data from %s", *source)
			read, readErr := ioutil.ReadFile(*source)
			if readErr != nil {
				logger.WithError(readErr).Fatalf("Unable to read given source file %s", *source)
			}
			if err := yaml.Unmarshal(read, &conf); err != nil {
				logger.WithError(err).Fatalf("Error parsing content of given source file %s", *source)
			}
			for idx, account := range conf.Accounts {
				conf.Accounts[idx].Name = sanitizer.Sanitize(account.Name)
			}
		} else {
			sanitizedAccountName := sanitizer.Sanitize(*accountName)
			if *email == "" || pw == "" || sanitizedAccountName == "" {
				logger.Fatal("Missing required parameters to create initial account, use the -help flag for reference on parameters")
			}
			logger.Infof("Using command line arguments to create seed account user and account")

			if *accountID == "" {
				if cfg.App.RootAccount != "" {
					// in case configuration knows about a root id, bootstrap
					// will use this ID for creating the new account
					*accountID = cfg.App.RootAccount
				} else {
					randomID, err := uuid.NewV4()
					if err != nil {
						logger.WithError(err).Fatal("Error creating account id")
					}
					*accountID = randomID.String()
				}
			} else {
				logger.Warnf("Using -forceid to set the ID of account %s to %s", sanitizedAccountName, *accountID)
				logger.Warn("If this is not intentional, please run this command again without forcing an ID")
			}

			if _, err := uuid.FromString(*accountID); err != nil {
				logger.Fatalf("Given account ID %s is not of expected UUID format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", *accountID)
			}

			conf.AccountUsers = append(
				conf.AccountUsers,
				persistence.BootstrapAccountUser{Email: *email, Password: pw, Accounts: []string{*accountID}},
			)
			conf.Accounts = append(
				conf.Accounts,
				persistence.BootstrapAccount{Name: sanitizedAccountName, AccountID: *accountID},
			)
		}
		conf.Force = *force

		gormDB, dbErr := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString.String())
		gormDB.LogMode(cfg.App.Development)

		if dbErr != nil {
			logger.WithError(dbErr).Fatal("Error establishing database connection")
		}

		db, dbErr := persistence.New(relational.NewRelationalDAL(gormDB))
		if dbErr != nil {
			logger.WithError(dbErr).Fatal("Error creating persistence layer")
		}

		if err := db.Migrate(); err != nil {
			logger.WithError(err).Fatal("Error applying database migrations")
		}

		if err := db.Bootstrap(conf); err != nil {
			logger.WithError(err).Fatal("Error bootstrapping database")
		}
		if *source == "" {
			logger.Infof("Successfully created account %s with ID %s, you can use the given credentials to access it", *accountName, *accountID)
		} else {
			logger.Infof("Successfully bootstrapped database from data in %s", *source)
		}
	case "migrate":
		migrateCmd.Usage = func() {
			fmt.Fprint(
				flag.CommandLine.Output(), `
"migrate" applies all pending database migrations to the connected database.
Only run this command when you run Offen as a horizontally scaling service.
The default installation will handle this routine by itself.

Usage of "migrate":
`)
			migrateCmd.PrintDefaults()
		}
		var (
			envFile = migrateCmd.String("envfile", "", "the env file to use")
		)
		migrateCmd.Parse(flags)
		cfg := mustConfig(false, *envFile)

		gormDB, dbErr := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString.String())
		if dbErr != nil {
			logger.WithError(dbErr).Fatal("Error establishing database connection")
		}
		gormDB.LogMode(cfg.App.Development)
		db, err := persistence.New(
			relational.NewRelationalDAL(gormDB),
		)
		if err != nil {
			logger.WithError(err).Fatal("Error creating persistence layer")
		}

		if err := db.Migrate(); err != nil {
			logger.WithError(err).Fatal("Error applying database migrations")
		}
		logger.Info("Successfully ran database migrations")
	case "expire":
		expireCmd.Usage = func() {
			fmt.Fprint(
				flag.CommandLine.Output(), `
"expire" prunes all events older than 6 months (4464 hours) from the connected
database. Only run this command when you run Offen as a horizontally scaling
service. The default installation will handle this routine by itself.

Usage of "expire":
`)
			expireCmd.PrintDefaults()
		}
		var (
			envFile = expireCmd.String("envfile", "", "the env file to use")
		)
		expireCmd.Parse(flags)
		cfg := mustConfig(false, *envFile)

		gormDB, dbErr := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString.String())
		if dbErr != nil {
			logger.WithError(dbErr).Fatal("Error establishing database connection")
		}
		gormDB.LogMode(cfg.App.Development)

		db, err := persistence.New(
			relational.NewRelationalDAL(gormDB),
		)
		if err != nil {
			logger.WithError(err).Fatalf("Error setting up database")
		}

		affected, err := db.Expire(config.EventRetention)
		if err != nil {
			logger.WithError(err).Fatalf("Error pruning expired events")
		}
		logger.WithField("removed", affected).Info("Successfully expired events")
	case "debug":
		debugCmd.Usage = func() {
			fmt.Fprint(
				flag.CommandLine.Output(), `
"debug" prints the runtime configuration resolved from the current working
directory.

Usage of "debug":
`)
			debugCmd.PrintDefaults()
		}

		var (
			envFile = debugCmd.String("envfile", "", "the env file to use")
		)
		debugCmd.Parse(flags)
		cfg := mustConfig(false, *envFile)
		logger.WithField("config", fmt.Sprintf("%+v", cfg)).Info("Current configuration values")
	case "secret":
		secretCmd.Usage = func() {
			fmt.Fprint(
				flag.CommandLine.Output(), `
"secret" can be used to generate Base64-encoded random secrets for signing
cookies or similar. The default length of 16 is a good default value for
generating a value to use as OFFEN_SECRETS_COOKIEEXCHANGE.

Usage of "secret":
`)
			secretCmd.PrintDefaults()
		}

		var (
			length = secretCmd.Int("length", keys.DefaultSecretLength, "the length in bytes")
			count  = secretCmd.Int("count", 1, "the number of secrets to generate")
		)
		secretCmd.Parse(flags)
		for i := 0; i < *count; i++ {
			value, err := keys.GenerateRandomValue(*length)
			if err != nil {
				log.Fatalf("Error creating secret: %v", err)
			}
			logger.WithField("secret", value).Infof("Created %d bytes secret", *length)
		}
	case "version":
		logger.WithField("revision", config.Revision).Info("Current build created using")
	default:
		logger.Fatalf("Unknown subcommand %s\n", os.Args[1])
	}
}

func mustSecret(length int) []byte {
	secret, err := keys.GenerateRandomValue(16)
	if err != nil {
		panic(err)
	}
	b, err := base64.StdEncoding.DecodeString(secret)
	if err != nil {
		panic(err)
	}
	return b
}
