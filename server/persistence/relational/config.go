package relational

import (
	"errors"
	"fmt"

	// GORM imports the dialects for side effects only
	// check `supportedDialects` for which ones need to be
	// imported
	_ "github.com/jinzhu/gorm/dialects/postgres"
)

var supportedDialects = []string{"postgres"}

type dbOptions struct {
	dialect          string
	connectionString string
}

// Config is a function that adds a configuration option to the constructor
type Config func(dbOptions) (dbOptions, error)

// WithConnectionString sets a connection string to be used when constructing
// a new persistence layer
func WithConnectionString(connectionString string) Config {
	return func(opts dbOptions) (dbOptions, error) {
		if connectionString == "" {
			return opts, errors.New("received empty connection string")
		}
		opts.connectionString = connectionString
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
			"received unsupported dialect %s, expected one of %v",
			dialect,
			supportedDialects,
		)
	}
}
