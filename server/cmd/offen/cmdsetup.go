package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	uuid "github.com/gofrs/uuid"
	"github.com/jinzhu/gorm"
	"github.com/microcosm-cc/bluemonday"
	"github.com/offen/offen/server/persistence"
	"github.com/offen/offen/server/persistence/relational"
	"golang.org/x/crypto/ssh/terminal"
	yaml "gopkg.in/yaml.v2"
)

var setupUsage = `
"setup" is used to populate a fresh Offen instance with user(s) and account(s).
In the most basic case, you are likely going to create a single user and an
account and then will use the UI to add more users create additional accounts.

A basic example for setting up a new instance looks like:

$ ./offen setup -name "My New Account" -email me@mydomain.org -populate

The command will then prompt for a password to use. Passing -populate will
create potentially missing secrets in your envfile. Do not pass the flag if you
plan to do this yourself.

If you do not want to use the CLI, you can also create an initial account and
user by visting "/setup/" in your browser while the Offen instance is running.

Usage of "setup":
`

func cmdSetup(subcommand string, flags []string) {
	cmd := flag.NewFlagSet(subcommand, flag.ExitOnError)
	cmd.Usage = func() {
		fmt.Fprint(flag.CommandLine.Output(), setupUsage)
		cmd.PrintDefaults()
	}
	var (
		accountName     = cmd.String("name", "", "the account name")
		email           = cmd.String("email", "", "the email address used for login")
		accountID       = cmd.String("forceid", "", "force usage of given valid UUID as account ID")
		password        = cmd.String("password", "", "the password used for login")
		source          = cmd.String("source", "", "a configuration file")
		envFile         = cmd.String("envfile", "", "the env file to use")
		force           = cmd.Bool("force", false, "allow setup to delete existing data")
		populateMissing = cmd.Bool("populate", false, "in case required secrets are missing from the configuration, create and persist them in the target env file")
	)
	cmd.Parse(flags)
	sanitizer := bluemonday.StrictPolicy()
	a := newApp(*populateMissing, *envFile)

	pw := *password
	if *source == "" && pw == "" {
		received := make(chan bool, 2)
		go func() {
			select {
			case <-received:
				return
			case <-time.Tick(time.Second / 10):
				a.logger.Info("You can now enter your password (input is not displayed):")
			}
		}()
		input, inputErr := terminal.ReadPassword(int(os.Stdin.Fd()))
		if inputErr != nil {
			a.logger.WithError(inputErr).Fatal("Error reading password")
		}
		pw = string(input)
	}
	conf := persistence.BootstrapConfig{}
	if *source != "" {
		a.logger.Infof("Trying to read account seed data from %s", *source)
		read, readErr := ioutil.ReadFile(*source)
		if readErr != nil {
			a.logger.WithError(readErr).Fatalf("Unable to read given source file %s", *source)
		}
		if err := yaml.Unmarshal(read, &conf); err != nil {
			a.logger.WithError(err).Fatalf("Error parsing content of given source file %s", *source)
		}
		for idx, account := range conf.Accounts {
			conf.Accounts[idx].Name = sanitizer.Sanitize(account.Name)
		}
	} else {
		sanitizedAccountName := sanitizer.Sanitize(*accountName)
		if *email == "" || pw == "" || sanitizedAccountName == "" {
			a.logger.Fatal("Missing required parameters to create initial account, use the -help flag for reference on parameters")
		}
		a.logger.Infof("Using command line arguments to create seed account user and account")

		if *accountID == "" {
			if a.config.App.RootAccount != "" {
				// in case configuration knows about a root id, bootstrap
				// will use this ID for creating the new account
				*accountID = a.config.App.RootAccount
			} else {
				randomID, err := uuid.NewV4()
				if err != nil {
					a.logger.WithError(err).Fatal("Error creating account id")
				}
				*accountID = randomID.String()
			}
		} else {
			a.logger.Warnf("Using -forceid to set the ID of account %s to %s", sanitizedAccountName, *accountID)
			a.logger.Warn("If this is not intentional, please run this command again without forcing an ID")
		}

		if _, err := uuid.FromString(*accountID); err != nil {
			a.logger.Fatalf("Given account ID %s is not of expected UUID format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", *accountID)
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

	gormDB, dbErr := gorm.Open(a.config.Database.Dialect.String(), a.config.Database.ConnectionString.String())
	gormDB.LogMode(a.config.App.Development)

	if dbErr != nil {
		a.logger.WithError(dbErr).Fatal("Error establishing database connection")
	}

	db, dbErr := persistence.New(relational.NewRelationalDAL(gormDB))
	if dbErr != nil {
		a.logger.WithError(dbErr).Fatal("Error creating persistence layer")
	}

	if err := db.Migrate(); err != nil {
		a.logger.WithError(err).Fatal("Error applying database migrations")
	}

	if err := db.Bootstrap(conf); err != nil {
		a.logger.WithError(err).Fatal("Error bootstrapping database")
	}
	if *source == "" {
		a.logger.Infof("Successfully created account %s with ID %s, you can use the given credentials to access it", *accountName, *accountID)
	} else {
		a.logger.Infof("Successfully bootstrapped database from data in %s", *source)
	}
}
