package main

import (
	"encoding/base64"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"time"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/persistence/relational"
)

func main() {
	secretCmd := flag.NewFlagSet("secret", flag.ExitOnError)
	bootstrapCmd := flag.NewFlagSet("bootstrap", flag.ExitOnError)
	migrateCmd := flag.NewFlagSet("migrate", flag.ExitOnError)
	expireCmd := flag.NewFlagSet("expire", flag.ExitOnError)

	if len(os.Args) < 2 {
		fmt.Println("No subcommand given. Exiting")
		os.Exit(1)
	}

	switch os.Args[1] {
	case "secret":
		var (
			length = secretCmd.Int("length", 16, "the length in bytes")
		)
		secretCmd.Parse(os.Args[2:])
		value, err := keys.GenerateRandomValue(*length)
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
		fmt.Println(value)
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
			fmt.Printf("Error reading configuration file %s: %v", *source, readErr)
			os.Exit(1)
		}
		saltBytes, saltErr := base64.StdEncoding.DecodeString(*emailSalt)
		if saltErr != nil {
			fmt.Printf("Error decoding given salt: %v\n", saltErr)
			os.Exit(1)
		}
		db, dbErr := gorm.Open("postgres", *connection)
		if dbErr != nil {
			fmt.Printf("Error establishing database connection: %v", dbErr)
			os.Exit(1)
		}

		if *migration {
			if err := relational.Migrate(db); err != nil {
				fmt.Printf("Error migrating database: %v\n", err)
				os.Exit(1)
			}
		}

		if err := relational.Bootstrap(read, db, saltBytes); err != nil {
			fmt.Printf("Error bootstrapping database: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Successfully boostrapped database")
	case "migrate":
		var (
			connection = migrateCmd.String("conn", os.Getenv("POSTGRES_CONNECTION_STRING"), "the postgres connection string")
		)
		migrateCmd.Parse(os.Args[2:])
		db, dbErr := gorm.Open("postgres", *connection)
		if dbErr != nil {
			fmt.Printf("Error establishing database connection: %v", dbErr)
			os.Exit(1)
		}

		if err := relational.Migrate(db); err != nil {
			fmt.Printf("Error running database migrations: %v\n", err)
			os.Exit(1)
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
			fmt.Printf("Error establishing database connection: %v", dbErr)
			os.Exit(1)
		}

		affected, err := relational.Expire(db, *retentionPeriod)
		if err != nil {
			fmt.Printf("Error expiring events: %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Successfully expired %d events\n", affected)
	default:
		fmt.Printf("Unknown subcommand %s\n", os.Args[1])
		os.Exit(1)
	}
}
