package config

import (
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
		Revision             string
		LogLevel             LogLevel `default:"info"`
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

// New returns a new runtime configuration
func New() (*Config, error) {
	godotenv.Load(".offen.env")
	var c Config
	err := envconfig.Process("offen", &c)
	c.App.Revision = Revision
	return &c, err
}
