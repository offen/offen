package relational

import (
	"errors"

	"github.com/jinzhu/gorm"
	// GORM imports the dialects for side effects only
	_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/offen/offen/server/persistence"
)

var ErrBadQuery = errors.New("dal: could not match query")

type relationalDatabase struct {
	db        *gorm.DB
	emailSalt []byte
}

// New creates a persistence layer that connects to a PostgreSQL database
func New(db *gorm.DB, configs ...Config) (persistence.Database, error) {
	opts := dbOptions{}
	for _, config := range configs {
		config(&opts)
	}

	db.LogMode(opts.logger)
	return &relationalDatabase{db, opts.emailSalt}, nil
}

type dbOptions struct {
	logger    bool
	emailSalt []byte
}

// Config is a function that adds a configuration option to the constructor
type Config func(*dbOptions)

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
