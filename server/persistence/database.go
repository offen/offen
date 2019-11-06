package persistence

import (
	"errors"

	// GORM imports the dialects for side effects only
	_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

// ErrBadQuery is returned when a DAL method cannot handle the given query
var ErrBadQuery = errors.New("dal: could not match query")

type relationalDatabase struct {
	db        DataAccessLayer
	emailSalt []byte
}

// New creates a persistence layer that connects to a PostgreSQL database
func New(db DataAccessLayer, configs ...Config) (Database, error) {
	opts := dbOptions{}
	for _, config := range configs {
		config(&opts)
	}
	return &relationalDatabase{db, opts.emailSalt}, nil
}

type dbOptions struct {
	emailSalt []byte
}

// Config is a function that adds a configuration option to the constructor
type Config func(*dbOptions)

// WithEmailSalt sets the salt value that is used for hashing email addresses
func WithEmailSalt(b []byte) Config {
	return func(opts *dbOptions) {
		opts.emailSalt = b
	}
}
