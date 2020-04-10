package main

import (
	"flag"
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
	"github.com/offen/offen/server/persistence/relational"
)

var migrateUsage = `
"migrate" applies all pending database migrations to the connected database.
Only run this command when you run Offen as a horizontally scaling service.
The default installation will handle this routine by itself.

Usage of "migrate":
`

func cmdMigrate(subcommand string, flags []string) {
	cmd := flag.NewFlagSet(subcommand, flag.ExitOnError)
	cmd.Usage = func() {
		fmt.Fprint(
			flag.CommandLine.Output(), migrateUsage)
		cmd.PrintDefaults()
	}
	var (
		envFile = cmd.String("envfile", "", "the env file to use")
	)
	cmd.Parse(flags)
	a := newApp(false, *envFile)

	gormDB, dbErr := gorm.Open(a.config.Database.Dialect.String(), a.config.Database.ConnectionString.String())
	if dbErr != nil {
		a.logger.WithError(dbErr).Fatal("Error establishing database connection")
	}
	gormDB.LogMode(a.config.App.Development)
	db, err := persistence.New(
		relational.NewRelationalDAL(gormDB),
	)
	if err != nil {
		a.logger.WithError(err).Fatal("Error creating persistence layer")
	}

	if err := db.Migrate(); err != nil {
		a.logger.WithError(err).Fatal("Error applying database migrations")
	}
	a.logger.Info("Successfully ran database migrations")
}
