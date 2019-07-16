package relational

import (
	"fmt"
	"os"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/keys"
	// GORM imports the dialects for side effects only
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence"
)

type relationalDatabase struct {
	db         *gorm.DB
	encryption keys.Encrypter
}

// New creates a persistence layer that connects to a PostgreSQL database
func New(configs ...Config) (persistence.Database, error) {
	opts := dbOptions{
		connectionString: os.Getenv("POSTGRES_CONNECTION_STRING"),
	}
	for _, config := range configs {
		config(&opts)
	}

	db, err := gorm.Open("postgres", opts.connectionString)
	if err != nil {
		return nil, fmt.Errorf("relational: error opening database: %v", err)
	}

	return &relationalDatabase{db, opts.encryption}, nil
}

type dbOptions struct {
	dialect          string
	connectionString string
	encryption       keys.Encrypter
}

// Config is a function that adds a configuration option to the constructor
type Config func(*dbOptions)

// WithConnectionString sets a connection string to be used when constructing
// a new persistence layer
func WithConnectionString(connectionString string) Config {
	return func(opts *dbOptions) {
		opts.connectionString = connectionString
	}
}

// WithEncryption adds a keyOps instance to be used for encrypting new keys for
// accounts
func WithEncryption(e keys.Encrypter) Config {
	return func(opts *dbOptions) {
		opts.encryption = e
	}
}
