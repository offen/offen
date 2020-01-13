package config

import (
	"errors"
	"fmt"
	"os"
	"path"
	"reflect"
	"runtime"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/mailer"
	"github.com/offen/offen/server/mailer/localmailer"
	"github.com/offen/offen/server/mailer/smtpmailer"
)

const envFileName = "offen.env"

// ErrPopulatedMissing can be returned by New to signal that missing values
// have been populated and persisted.
var ErrPopulatedMissing = errors.New("populated missing secrets")

// Revision will be set by ldflags on build time
var Revision string

// IsDefaultDatabase checks whether the database connection string matches
// the default value.
func (c *Config) IsDefaultDatabase() bool {
	field, _ := reflect.TypeOf(c.Database).FieldByName("ConnectionString")
	return c.Database.ConnectionString == field.Tag.Get("default")
}

// SMTPConfigured returns true if all required SMTP credentials are set
func (c *Config) SMTPConfigured() bool {
	return c.SMTP.User != "" && c.SMTP.Host != "" && c.SMTP.Password != ""
}

// NewMailer returns the appropriate mailer to use with the given config.
func (c *Config) NewMailer() mailer.Mailer {
	if !c.SMTPConfigured() {
		return localmailer.New()
	}
	return smtpmailer.New(c.SMTP.Host, c.SMTP.User, c.SMTP.Password, c.SMTP.Port)
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
	if err != nil && !populateMissing {
		return &c, fmt.Errorf("config: error processing configuration: %w", err)
	}

	// these might contain environment variables on windows so we expand them
	c.Database.ConnectionString = ExpandString(c.Database.ConnectionString)
	c.Server.CertificateCache = ExpandString(c.Server.CertificateCache)

	if err != nil && populateMissing {
		if envFile == "" {
			return nil, errors.New("config: unable to find env file to persist settings as no env file could be found")
		}
		update := map[string]string{}
		for _, key := range []string{"OFFEN_SECRETS_EMAILSALT", "OFFEN_SECRETS_COOKIEEXCHANGE"} {
			secret, err := keys.GenerateRandomValue(keys.DefaultSecretLength)
			update[key] = secret
			if err != nil {
				return nil, fmt.Errorf("config: error creating secret for use as %s: %w", key, err)
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

	return &c, nil
}
