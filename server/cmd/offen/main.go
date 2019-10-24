package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/router"
	"github.com/sirupsen/logrus"
)

func main() {
	secretCmd := flag.NewFlagSet("secret", flag.ExitOnError)
	bootstrapCmd := flag.NewFlagSet("bootstrap", flag.ExitOnError)

	if len(os.Args) < 2 {
		log.Fatal("No subcommand given. Exiting")
	}

	cfg, cfgErr := config.New()
	if cfgErr != nil {
		log.Fatalf("Error sourcing runtime configuration: %v", cfgErr)
	}

	switch os.Args[1] {
	case "secret":
		var (
			length = secretCmd.Int("length", 16, "the length in bytes")
			count  = secretCmd.Int("count", 1, "the number of secrets to generate")
		)
		secretCmd.Parse(os.Args[2:])
		for i := 0; i < *count; i++ {
			value, err := keys.GenerateRandomValue(*length)
			if err != nil {
				log.Fatalf("Error creating secret: %v", err)
			}
			fmt.Println(value)
		}
	case "version":
		fmt.Println(cfg.App.Revision)
	case "bootstrap":
		var (
			migration = bootstrapCmd.Bool("migration", true, "whether to run migrations")
			source    = bootstrapCmd.String("source", "bootstrap.yml", "the configuration file")
		)
		bootstrapCmd.Parse(os.Args[2:])
		read, readErr := ioutil.ReadFile(*source)
		if readErr != nil {
			log.Fatalf("Error reading source file %s: %v", *source, readErr)
		}
		db, dbErr := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString)
		if dbErr != nil {
			log.Fatalf("Error establishing database connection: %v", dbErr)
		}

		if *migration {
			if err := relational.Migrate(db); err != nil {
				log.Fatalf("Error migrating database: %v\n", err)
			}
		}

		if err := relational.Bootstrap(db, read, cfg.Secrets.EmailSalt.Bytes()); err != nil {
			log.Fatalf("Error bootstrapping database: %v\n", err)
		}
		fmt.Println("Successfully boostrapped database")
	case "migrate":
		db, dbErr := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString)
		if dbErr != nil {
			log.Fatalf("Error establishing database connection: %v", dbErr)
		}

		if err := relational.Migrate(db); err != nil {
			log.Fatalf("Error running database migrations: %v\n", err)
		}
		fmt.Println("Successfully ran database migrations")
	case "expire":
		db, dbErr := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString)
		if dbErr != nil {
			log.Fatalf("Error establishing database connection: %v", dbErr)
		}

		affected, err := relational.Expire(db, cfg.App.EventRetentionPeriod)
		if err != nil {
			log.Fatalf("Error expiring events: %v\n", err)
		}
		fmt.Printf("Successfully expired %d events\n", affected)
	case "serve":
		logger := logrus.New()
		logger.SetLevel(logrus.InfoLevel)

		gormDB, err := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString)
		if err != nil {
			logger.WithError(err).Fatal("unable to establish database connection")
		}

		db, err := relational.New(
			gormDB,
			relational.WithLogging(cfg.App.Development),
			relational.WithEmailSalt(cfg.Secrets.EmailSalt.Bytes()),
		)
		if err != nil {
			logger.WithError(err).Fatal("unable to create database layer")
		}

		srv := &http.Server{
			Addr: fmt.Sprintf("0.0.0.0:%d", cfg.Server.Port),
			Handler: router.New(
				router.WithDatabase(db),
				router.WithLogger(logger),
				router.WithSecureCookie(!cfg.App.DisableSecureCookie),
				router.WithCookieExchangeSecret(cfg.Secrets.CookieExchange.Bytes()),
				router.WithRetentionPeriod(cfg.App.EventRetentionPeriod),
				router.WithMailer(cfg.NewMailer()),
				router.WithRevision(cfg.App.Revision),
			),
		}

		if err := srv.ListenAndServe(); err != nil {
			log.Fatal(err)
		}
	default:
		log.Fatalf("Unknown subcommand %s\n", os.Args[1])
	}
}
