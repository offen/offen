// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"flag"
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/persistence"
	"github.com/offen/offen/server/persistence/relational"
)

var expireUsage = `
"expire" prunes all events older than 6 months (4464 hours) from the connected
database. Only run this command when you run Offen as a horizontally scaling
service. The default installation will handle this routine by itself.

Usage of "expire":
`

func cmdExpire(subcommand string, flags []string) {
	cmd := flag.NewFlagSet(subcommand, flag.ExitOnError)
	cmd.Usage = func() {
		fmt.Fprint(flag.CommandLine.Output(), expireUsage)
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
		a.logger.WithError(err).Fatalf("Error setting up database")
	}

	affected, err := db.Expire(config.EventRetention)
	if err != nil {
		a.logger.WithError(err).Fatalf("Error pruning expired events")
	}
	a.logger.WithField("removed", affected).Info("Successfully expired events")
}
