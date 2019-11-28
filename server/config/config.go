package config

import (
	"errors"
	"fmt"
	"os"
	"reflect"
	"runtime"
	"time"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/mailer"
	"github.com/offen/offen/server/mailer/localmailer"
	"github.com/offen/offen/server/mailer/smtpmailer"
)

// ErrPopulatedMissing can be returned by New to signal that missing values
// have been populated and persisted.
var ErrPopulatedMissing = errors.New("created missing secrets in ~/.config/offen.env")

// Revision will be set by ldflags on build time
var Revision string

// Config contains all runtime configuration needed for running offen as
// and also defines the desired defaults. Package envconfig is used to
// source values from the application environment at runtime.
type Config struct {
	Server struct {
		Port           int  `default:"8080"`
		ReverseProxy   bool `default:"false"`
		SSLCertificate string
		SSLKey         string
		AutoTLS        string
	}
	Database struct {
		Dialect          Dialect `default:"sqlite3"`
		ConnectionString string  `default:"/tmp/offen.db"`
	}
	App struct {
		Development          bool          `default:"false"`
		EventRetentionPeriod time.Duration `default:"4464h"`
		Revision             string        `default:"not set"`
		LogLevel             LogLevel      `default:"info"`
		SingleNode           bool          `default:"true"`
		Locale               Locale        `default:"en"`
		RootAccount          string
	}
	Secrets struct {
		CookieExchange Bytes `required:"true"`
		EmailSalt      Bytes `required:"true"`
	}
	SMTP struct {
		User     string
		Password string
		Host     string
		Port     int `default:"587"`
	}
}

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
	user, pass, host, port := c.SMTP.Host, c.SMTP.User, c.SMTP.Password, c.SMTP.Port
	return smtpmailer.New(host, user, pass, port)
}

const envFileName = "offen.env"

func configurationCascade() []string {
	// in case there is an offen.env file next to the binary, it will be loaded
	// as the env file with the highest precedence
	locations := []string{envFileName}
	if homedir, err := os.UserHomeDir(); err == nil {
		// user specific configuration is looked up in ~/.config/offen.env
		locations = append(locations, fmt.Sprintf("%s/.config/%s", homedir, envFileName))
	}
	if runtime.GOOS == "linux" {
		// when running in linux, system wide configuration is sourced from
		// /etc/offen first
		locations = append(locations, fmt.Sprintf("/etc/offen/%s", envFileName))
	}
	return locations
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
func New(populateMissing bool) (*Config, error) {
	var c Config

	// Depending on the system, a certain cascade of configuration options will
	// be sourced. In case a variable is already set in the environment, it will
	// not be overridden by any file content.
	for _, loc := range configurationCascade() {
		godotenv.Load(loc)
	}

	err := envconfig.Process("offen", &c)
	if err != nil && !populateMissing {
		return &c, fmt.Errorf("error processing environment: %v", err)
	}

	if Revision != "" {
		c.App.Revision = Revision
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

		result, err := New(false)
		if err == nil {
			err = ErrPopulatedMissing
		}
		return result, err
	}

	return &c, nil
}
