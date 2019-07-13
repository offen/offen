package relational

import (
	"errors"
	"fmt"
	"os"

	"github.com/offen/offen/server/keys"

	"github.com/jinzhu/gorm"
	// GORM imports the dialects for side effects only
	// check `supportedDialects` for which ones need to be
	// imported
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence"
)

var supportedDialects = []string{"postgres"}

type relationalDatabase struct {
	db         *gorm.DB
	encryption keys.Encrypter
}

// New creates a persistence layer that connects to a PostgreSQL database
func New(configs ...Config) (persistence.Database, error) {
	opts := dbOptions{
		dialect:          "postgres",
		connectionString: os.Getenv("POSTGRES_CONNECTION_STRING"),
	}
	for _, config := range configs {
		var err error
		opts, err = config(opts)
		if err != nil {
			return nil, fmt.Errorf("relational: error configuring instance: %v", err)
		}
	}

	db, err := gorm.Open(opts.dialect, opts.connectionString)
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
type Config func(dbOptions) (dbOptions, error)

// WithConnectionString sets a connection string to be used when constructing
// a new persistence layer
func WithConnectionString(connectionString string) Config {
	return func(opts dbOptions) (dbOptions, error) {
		if connectionString == "" {
			return opts, errors.New("relational: received empty connection string")
		}
		opts.connectionString = connectionString
		return opts, nil
	}
}

// WithEncryption adds a keyOps instance to be used for encrypting new keys for
// accounts
func WithEncryption(e keys.Encrypter) Config {
	return func(opts dbOptions) (dbOptions, error) {
		if e == nil {
			return opts, errors.New("relational: received nil encryption instance")
		}
		opts.encryption = e
		return opts, nil
	}
}

// WithDialect sets the dialect to be used when constructing a new persistence
// layer
func WithDialect(dialect string) Config {
	return func(opts dbOptions) (dbOptions, error) {
		for _, supportedDialect := range supportedDialects {
			if dialect != supportedDialect {
				continue
			}
			opts.dialect = dialect
			return opts, nil
		}
		return opts, fmt.Errorf(
			"relational: received unsupported dialect %s, expected one of %v",
			dialect,
			supportedDialects,
		)
	}
}
