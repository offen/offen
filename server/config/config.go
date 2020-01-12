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
var ErrPopulatedMissing = errors.New("created missing secrets in ~/.config/offen.env")

// Revision will be set by ldflags on build time
var Revision string

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
			path.Join(os.ExpandEnv("$HOME/.config"), envFileName),
			path.Join(os.ExpandEnv("$XDG_CONFIG_HOME"), envFileName),
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

// PersistSettings persists the given update on disk.
func PersistSettings(update map[string]string) error {
	switch runtime.GOOS {
	case "linux", "darwin":
		homedir, err := os.UserHomeDir()
		if err != nil {
			return fmt.Errorf("error looking up home directory: %v", err)
		}
		configFile := fmt.Sprintf("%s/.config/%s", homedir, envFileName)
		existing, _ := godotenv.Read(configFile)
		if existing != nil {
			for key, value := range existing {
				update[key] = value
			}
		}
		_ = os.Mkdir(fmt.Sprintf("%s/.config", homedir), os.ModeDir)
		if err := godotenv.Write(update, configFile); err != nil {
			return fmt.Errorf("error writing env file: %v", err)
		}
		return nil
	default:
		return fmt.Errorf("operating system %s not yet supported", runtime.GOOS)
	}
}

// New returns a new runtime configuration
func New(populateMissing bool, override string) (*Config, error) {
	var c Config
	// Depending on the system, a certain cascade of configuration options will
	// be sourced. In case a variable is already set in the environment, it will
	// not be overridden by any file content.
	if override != "" {
		if _, err := os.Stat(override); err != nil {
			return nil, fmt.Errorf("config: error looking up config file override: %w", err)
		}
		godotenv.Load(override)
	} else {
		match, err := walkConfigurationCascade()
		if err != nil {
			return nil, fmt.Errorf("config: error checking if config file exists: %w", err)
		}
		// there might not exist a config file at all in which case all values
		// are sourced from environment variables
		if match != "" {
			godotenv.Load(match)
		}
	}

	err := envconfig.Process("offen", &c)
	if err != nil && !populateMissing {
		return &c, fmt.Errorf("error processing environment: %v", err)
	}

	if err != nil && populateMissing {
		update := map[string]string{}
		for _, key := range []string{"OFFEN_SECRETS_EMAILSALT", "OFFEN_SECRETS_COOKIEEXCHANGE"} {
			secret, err := keys.GenerateRandomValue(keys.DefaultSecretLength)
			update[key] = secret
			if err != nil {
				return nil, fmt.Errorf("error creating secret for use as %s: %v", key, err)
			}
		}

		if err := PersistSettings(update); err != nil {
			return nil, fmt.Errorf("error persisting settings: %v", err)
		}

		result, err := New(false, override)
		if err == nil {
			err = ErrPopulatedMissing
		}
		return result, err
	}

	return &c, nil
}
