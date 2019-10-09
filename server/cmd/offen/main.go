package main

import (
	"encoding/base64"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	httpconfig "github.com/offen/offen/server/config/http"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/router"
	"github.com/sirupsen/logrus"
)

func main() {
	secretCmd := flag.NewFlagSet("secret", flag.ExitOnError)
	bootstrapCmd := flag.NewFlagSet("bootstrap", flag.ExitOnError)
	migrateCmd := flag.NewFlagSet("migrate", flag.ExitOnError)
	expireCmd := flag.NewFlagSet("expire", flag.ExitOnError)

	if len(os.Args) < 2 {
		log.Fatal("No subcommand given. Exiting")
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
	case "bootstrap":
		var (
			migration  = bootstrapCmd.Bool("migration", true, "run migrations")
			source     = bootstrapCmd.String("source", "bootstrap.yml", "the configuration file")
			connection = bootstrapCmd.String("conn", os.Getenv("POSTGRES_CONNECTION_STRING"), "the postgres connection string")
			emailSalt  = bootstrapCmd.String("salt", os.Getenv("ACCOUNT_USER_EMAIL_SALT"), "the salt value used when hashing account user emails")
		)
		bootstrapCmd.Parse(os.Args[2:])
		read, readErr := ioutil.ReadFile(*source)
		if readErr != nil {
			log.Fatalf("Error reading configuration file %s: %v", *source, readErr)
		}
		saltBytes, saltErr := base64.StdEncoding.DecodeString(*emailSalt)
		if saltErr != nil {
			log.Fatalf("Error decoding given salt: %v\n", saltErr)
		}
		db, dbErr := gorm.Open("postgres", *connection)
		if dbErr != nil {
			log.Fatalf("Error establishing database connection: %v", dbErr)
		}

		if *migration {
			if err := relational.Migrate(db); err != nil {
				log.Fatalf("Error migrating database: %v\n", err)
			}
		}

		if err := relational.Bootstrap(db, read, saltBytes); err != nil {
			log.Fatalf("Error bootstrapping database: %v\n", err)
		}
		fmt.Println("Successfully boostrapped database")
	case "migrate":
		var (
			connection = migrateCmd.String("conn", os.Getenv("POSTGRES_CONNECTION_STRING"), "the postgres connection string")
		)
		migrateCmd.Parse(os.Args[2:])
		db, dbErr := gorm.Open("postgres", *connection)
		if dbErr != nil {
			log.Fatalf("Error establishing database connection: %v", dbErr)
		}

		if err := relational.Migrate(db); err != nil {
			log.Fatalf("Error running database migrations: %v\n", err)
		}
		fmt.Println("Successfully ran database migrations")
	case "expire":
		var (
			connection      = migrateCmd.String("conn", os.Getenv("POSTGRES_CONNECTION_STRING"), "the postgres connection string")
			retentionPeriod = migrateCmd.Duration("retention", time.Hour*4464, "the desired ttl for events")
		)
		expireCmd.Parse(os.Args[2:])
		db, dbErr := gorm.Open("postgres", *connection)
		if dbErr != nil {
			log.Fatalf("Error establishing database connection: %v", dbErr)
		}

		affected, err := relational.Expire(db, *retentionPeriod)
		if err != nil {
			log.Fatalf("Error expiring events: %v\n", err)
		}
		fmt.Printf("Successfully expired %d events\n", affected)
	case "serve":
		cfg, cfgErr := httpconfig.New()
		if cfgErr != nil {
			log.Fatalf("Error creating runtime configuration: %v", cfgErr)
		}

		logger := logrus.New()
		logger.SetLevel(cfg.LogLevel())

		db, err := relational.New(
			relational.WithConnectionString(cfg.ConnectionString()),
			relational.WithLogging(cfg.Development()),
			relational.WithEmailSalt(cfg.AccountUserSalt()),
		)
		if err != nil {
			logger.WithError(err).Fatal("unable to establish database connection")
		}

		srv := &http.Server{
			Addr: fmt.Sprintf("0.0.0.0:%d", cfg.Port()),
			Handler: router.New(
				router.WithDatabase(db),
				router.WithLogger(logger),
				router.WithSecureCookie(cfg.SecureCookie()),
				router.WithCookieExchangeSecret(cfg.CookieExchangeSecret()),
				router.WithRetentionPeriod(cfg.RetentionPeriod()),
				router.WithMailer(cfg.Mailer()),
				router.WithRevision(cfg.Revision()),
			),
		}

		if err := srv.ListenAndServe(); err != nil {
			log.Fatal(err)
		}
	default:
		log.Fatalf("Unknown subcommand %s\n", os.Args[1])
	}
}
