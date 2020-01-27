package main

import (
	"bufio"
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
	"github.com/jasonlvhit/gocron"
	"github.com/jinzhu/gorm"
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
	var flags []string
	if len(os.Args) > 1 {
		subcommand = os.Args[1]
		flags = os.Args[2:]
	}
	if strings.HasPrefix(subcommand, "-") {
		subcommand = "serve"
		flags = os.Args[1:]
	}

	switch subcommand {
	case "demo":
		var (
			port = demoCmd.Int("port", 0, "the port to bind to")
		)
		demoCmd.Parse(flags)

		cfg, _ := config.New(false, "")
		cfg.Database.Dialect = config.Dialect("sqlite3")
		cfg.Database.ConnectionString = ":memory:"
		cfg.Secrets.CookieExchange = mustSecret(16)
		cfg.Secrets.EmailSalt = mustSecret(16)

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
			persistence.WithEmailSalt(cfg.Secrets.EmailSalt.Bytes()),
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
		}, cfg.Secrets.EmailSalt.Bytes()); err != nil {
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
			persistence.WithEmailSalt(cfg.Secrets.EmailSalt.Bytes()),
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
			),
		}
		go func() {
			if cfg.Server.SSLCertificate != "" && cfg.Server.SSLKey != "" {
				err := srv.ListenAndServeTLS(cfg.Server.SSLCertificate.String(), cfg.Server.SSLKey.String())
				if err != nil && err != http.ErrServerClosed {
					logger.WithError(err).Fatal("Error binding server to network")
				}
			} else if cfg.Server.AutoTLS != "" {
				m := autocert.Manager{
					Prompt:     autocert.AcceptTOS,
					HostPolicy: autocert.HostWhitelist(cfg.Server.AutoTLS),
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
		if cfg.Server.AutoTLS != "" {
			logger.Info("Server now listening on port 80 and 443 using AutoTLS")
		} else {
			logger.Infof("Server now listening on port %d", cfg.Server.Port)
		}

		if cfg.App.SingleNode {
			scheduler := gocron.NewScheduler()
			scheduler.Every(1).Hours().Do(func() {
				affected, err := db.Expire(cfg.App.EventRetentionPeriod)
				if err != nil {
					logger.WithError(err).Errorf("Error pruning expired events")
					return
				}
				logger.WithField("removed", affected).Info("Cron successfully pruned expired events")
			})
			go func() {
				scheduler.RunAll()
				scheduler.Start()
			}()
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
		var (
			accountID         = setupCmd.String("forceid", "", "force usage of given valid UUID as account ID")
			accountName       = setupCmd.String("name", "", "the account name")
			email             = setupCmd.String("email", "", "the email address used for login")
			password          = setupCmd.String("password", "", "the password used for login")
			passwordFromStdin = setupCmd.Bool("stdin-password", false, "read password from stdin")
			source            = setupCmd.String("source", "", "a configuration file")
			envFile           = setupCmd.String("envfile", "", "the env file to use")
			populateMissing   = setupCmd.Bool("populate", false, "in case required secrets are missing from the configuration, create and persist them in the target env file")
		)
		setupCmd.Parse(flags)

		pw := *password
		if *passwordFromStdin {
			sc := bufio.NewScanner(os.Stdin)
			received := make(chan bool, 2)
			go func() {
				select {
				case <-received:
					return
				case <-time.Tick(time.Second / 10):
					logger.Info("You can now enter your password (this will be displayed in clear text):")
				}
			}()
			for sc.Scan() {
				received <- true
				close(received)
				pw = sc.Text()
				break
			}
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
		} else {
			if *email == "" || pw == "" || *accountName == "" {
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
				logger.Warnf("Using -forceid to set the ID of account %s to %s", *accountName, *accountID)
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
				persistence.BootstrapAccount{Name: *accountName, AccountID: *accountID},
			)
		}

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

		if err := db.Bootstrap(conf, cfg.Secrets.EmailSalt.Bytes()); err != nil {
			logger.WithError(err).Fatal("Error bootstrapping database")
		}
		if *source == "" {
			logger.Infof("Successfully created account %s with ID %s, you can use the given credentials to access it", *accountName, *accountID)
		} else {
			logger.Infof("Successfully bootstrapped database from data in %s", *source)
		}
	case "migrate":
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

		affected, err := db.Expire(cfg.App.EventRetentionPeriod)
		if err != nil {
			logger.WithError(err).Fatalf("Error pruning expired events")
		}
		logger.WithField("removed", affected).Info("Successfully expired events")
	case "debug":
		var (
			envFile = debugCmd.String("envfile", "", "the env file to use")
		)
		debugCmd.Parse(flags)
		cfg := mustConfig(false, *envFile)
		logger.WithField("config", fmt.Sprintf("%+v", cfg)).Info("Current configuration values")
	case "secret":
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
