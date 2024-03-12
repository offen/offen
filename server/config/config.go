// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"errors"
	"fmt"
	"os"
	"path"
	"runtime"
	"time"

	"github.com/joho/godotenv"
	"github.com/offen/envconfig"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/mailer"
	"github.com/offen/offen/server/mailer/localmailer"
	"github.com/offen/offen/server/mailer/sendmailmailer"
	"github.com/offen/offen/server/mailer/smtpmailer"
)

const envFileName = "offen.env"

var (
	// EventRetention defines the duration for which events are expected to
	//  be kept before expired. This value can be overridden by setting OFFEN_APP_RETENTION_DAYS
	EventRetention = time.Hour * 24 * 6 * 31
)

// ErrPopulatedMissing can be returned by New to signal that missing values
// have been populated and persisted.
var ErrPopulatedMissing = errors.New("populated missing secrets")

// Revision will be set by ldflags on build time
var Revision string

// SMTPConfigured returns true if a SMTP Host is configured
func (c *Config) SMTPConfigured() bool {
	return c.SMTP.Host != ""
}

// NewMailer returns a new mailer that is suitable for the given config.
// In development, mail content will be printed to stdout. In production,
// SMTP is preferred and falls back to sendmail if no SMTP credentials are given.
func (c *Config) NewMailer() mailer.Mailer {
	if c.App.Development {
		return localmailer.New()
	}
	if c.SMTPConfigured() {
		return smtpmailer.New(c.SMTP.Host, c.SMTP.User, c.SMTP.Password, c.SMTP.Port)
	}
	return sendmailmailer.New()
}

func walkConfigurationCascade() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("config: error looking up current working directory: %w", err)
	}
	// in case there is an offen.env file next to the binary, it will be loaded
	// as the env file with the highest precedence
	var cascade []string
	switch runtime.GOOS {
	case "windows":
		cascade = []string{
			path.Join(wd, envFileName),
		}
	case "darwin", "linux":
		cascade = []string{
			path.Join(wd, envFileName),
			path.Join(ExpandString("$HOME/.config"), envFileName),
			path.Join(ExpandString("$XDG_CONFIG_HOME"), envFileName),
			path.Join("/etc/offen", envFileName),
		}
	}
	for _, file := range cascade {
		_, err := os.Stat(file)
		if os.IsNotExist(err) {
			continue
		} else if err != nil {
			return "", fmt.Errorf("config: error checking if config file exists in location %s: %w", file, err)
		}
		return file, nil
	}
	return "", nil
}

func persistSettings(update map[string]string, envFile string) error {
	if envFile == "" {
		wd, err := os.Getwd()
		if err != nil {
			return fmt.Errorf("config: error looking up current working directory: %w", err)
		}
		envFile = path.Join(wd, envFileName)
	}
	existing, _ := godotenv.Read(envFile)
	if existing != nil {
		for key, value := range existing {
			update[key] = value
		}
	}
	if err := godotenv.Write(update, envFile); err != nil {
		return fmt.Errorf("config: error writing env file: %w", err)
	}
	return nil
}

type autopopulatedValue struct {
	key     string
	isEmpty func() bool
}

// New returns a new runtime configuration
func New(populateMissing bool, override string) (*Config, error) {
	var c Config
	var envFile string
	// Depending on the system, a certain cascade of configuration options will
	// be sourced. In case a variable is already set in the environment, it will
	// not be overridden by any file content.
	if override != "" {
		if _, err := os.Stat(override); err != nil {
			return nil, fmt.Errorf("config: error looking up config file override: %w", err)
		}
		envFile = override
	} else {
		match, err := walkConfigurationCascade()
		if err != nil {
			return nil, fmt.Errorf("config: error checking if config file exists: %w", err)
		}
		// there might not exist a config file at all in which case all values
		// are sourced from environment variables
		if match != "" {
			envFile = match
		}
	}

	if envFile != "" {
		godotenv.Load(envFile)
	}

	err := envconfig.Process("offen", &c)
	if err != nil {
		return &c, fmt.Errorf("config: error processing configuration: %w", err)
	}

	if populateMissing {
		if envFile == "" {
			return nil, errors.New("config: unable to find env file to persist settings as no env file could be found")
		}
		update := map[string]string{}
		for _, val := range []autopopulatedValue{
			{"OFFEN_SECRET", c.Secret.IsZero},
		} {
			if !val.isEmpty() {
				fmt.Println("val not empty, skipping")
				continue
			}
			secret, err := keys.GenerateRandomValue(keys.DefaultSecretLength)
			update[val.key] = secret
			if err != nil {
				return nil, fmt.Errorf("config: error creating secret for use as %s: %w", val.key, err)
			}
		}

		if err := persistSettings(update, envFile); err != nil {
			return nil, fmt.Errorf("config: error persisting settings: %w", err)
		}

		result, err := New(false, override)
		if err == nil {
			err = ErrPopulatedMissing
		}
		return result, err
	}

	if c.Secret.IsZero() {
		cookieSecret, cookieSecretErr := keys.GenerateRandomBytes(keys.DefaultSecretLength)
		if cookieSecretErr != nil {
			return &c, fmt.Errorf("config: error creating cookie one-off secret: %w", cookieSecretErr)
		}
		c.Secret = Bytes(cookieSecret)
	}

	EventRetention = c.App.Retention.retention

	// some deploy targets have custom overrides for creating the
	// runtime configuration
	switch c.App.DeployTarget {
	case DeployTargetHeroku:
		if err := applyHerokuSpecificOverrides(&c); err != nil {
			return &c, fmt.Errorf("config: error applying deploy target specific rules: %w", err)
		}
	}

	return &c, nil
}
