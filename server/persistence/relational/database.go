package relational

import (
	"fmt"
	"os"

	"github.com/jinzhu/gorm"
	// GORM imports the dialects for side effects only
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence"
)

type relationalDatabase struct {
	db        *gorm.DB
	emailSalt []byte
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
	db.LogMode(opts.logger)
	if err != nil {
		return nil, fmt.Errorf("relational: error opening database: %v", err)
	}

	return &relationalDatabase{db, opts.emailSalt}, nil
}

type dbOptions struct {
	dialect          string
	connectionString string
	logger           bool
	emailSalt        []byte
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

// WithLogging will print additional debug information when set to true
func WithLogging(l bool) Config {
	return func(opts *dbOptions) {
		opts.logger = l
	}
}

// WithEmailSalt sets the salt value that is used for hashing email addresses
func WithEmailSalt(b []byte) Config {
	return func(opts *dbOptions) {
		opts.emailSalt = b
	}
}
