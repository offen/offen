// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"fmt"

	"github.com/offen/envconfig"
)

type herokuRuntime struct {
	DatabaseURL string `split_words:"true"`
	Port        int
	AppSecret   string `split_words:"true"`
}

func applyHerokuSpecificOverrides(c *Config) error {
	var overrides herokuRuntime
	if err := envconfig.Process("", &overrides); err != nil {
		return fmt.Errorf("config: error applying heroku specific runtime overrides: %w", err)
	}
	if overrides.DatabaseURL != "" {
		c.Database.ConnectionString = EnvString(overrides.DatabaseURL)
	}
	if overrides.Port != 0 {
		c.Server.Port = overrides.Port
	}
	if overrides.AppSecret != "" {
		c.Secret = []byte(overrides.AppSecret)
	}
	return nil
}
