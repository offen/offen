// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"errors"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/config"
	"github.com/sirupsen/logrus"
)

type app struct {
	logger *logrus.Logger
	config *config.Config
}

func newApp(populateMissing, quiet bool, envFileOverride string) *app {
	logger := logrus.New()
	cfg, cfgErr := config.New(populateMissing, envFileOverride)
	if cfgErr != nil {
		if errors.Is(cfgErr, config.ErrPopulatedMissing) {
			logger.Infof("Some configuration values were missing: %v", cfgErr.Error())
		} else {
			logger.WithError(cfgErr).Fatal("Error sourcing runtime configuration")
		}
	}

	logger.SetLevel(cfg.App.LogLevel.LogLevel())
	if !quiet && !cfg.SMTPConfigured() {
		logger.Warn("SMTP for transactional email is not configured right now, mail delivery will be unreliable")
		logger.Warn("Refer to the documentation to find out how to configure SMTP")
	}
	return &app{
		logger: logger,
		config: cfg,
	}
}

func newLogger() *logrus.Logger {
	return logrus.New()
}

func newDB(c *config.Config) (*gorm.DB, error) {
	gormDB, err := gorm.Open(c.Database.Dialect.String(), c.Database.ConnectionString.String())
	if err != nil {
		return nil, err
	}
	gormDB.LogMode(c.App.Development)
	if c.Database.Dialect == "sqlite3" {
		gormDB.DB().SetMaxOpenConns(1)
	}
	return gormDB, nil
}
