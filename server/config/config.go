package config

import (
	"fmt"
	"os"
	"runtime"
	"time"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/offen/offen/server/mailer"
	"github.com/offen/offen/server/mailer/localmailer"
	"github.com/offen/offen/server/mailer/smtpmailer"
)

// Revision will be set by ldflags on build time
var Revision = "not set"

// Config contains all runtime configuration needed for running offen as
// and also defines the desired defaults. Package envconfig is used to
// source values from the application environment at runtime.
type Config struct {
	Server struct {
		Port         int  `default:"8080"`
		ReverseProxy bool `default:"false"`
	}
	App struct {
		Development          bool          `default:"false"`
		EventRetentionPeriod time.Duration `default:"4464h"`
		DisableSecureCookie  bool          `default:"false"`
		Revision             string        `default:"not set"`
		LogLevel             LogLevel      `default:"info"`
		SingleNode           bool          `default:"true"`
	}
	Database struct {
		Dialect          Dialect `default:"sqlite3"`
		ConnectionString string  `default:"/tmp/offen.db"`
	}
	Secrets struct {
		CookieExchange Bytes
		EmailSalt      Bytes
	}
	SMTP struct {
		User     string
		Password string
		Host     string
		Port     int `default:"587"`
	}
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

// New returns a new runtime configuration
func New() (*Config, error) {
	// Depending on the system, a certain cascade of configuration options will
	// be sourced. In case a variable is already set in the environment, it will
	// not be overridden by any file content.
	for _, loc := range configurationCascade() {
		if err := godotenv.Load(loc); err != nil {
			fmt.Println("error reading file", err)
		}
	}
	var c Config
	err := envconfig.Process("offen", &c)
	c.App.Revision = Revision
	return &c, err
}
