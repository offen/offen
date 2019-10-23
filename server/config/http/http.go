package http

import (
	"encoding/base64"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/mailer"
	"github.com/offen/offen/server/mailer/localmailer"
	"github.com/offen/offen/server/mailer/smtpmailer"
	"github.com/sirupsen/logrus"
)

type httpConfig struct {
	port                 int
	secureCookie         bool
	development          bool
	connectionString     string
	cookieExchangeSecret string
	accountUserSalt      string
	dialect              string
	retentionPeriod      time.Duration
}

// Revision will be set by ldflags on build time
var Revision string

func (h *httpConfig) Revision() string {
	if Revision == "" {
		return "not set"
	}
	return Revision
}
func (h *httpConfig) Port() int                { return h.port }
func (h *httpConfig) ConnectionString() string { return h.connectionString }
func (h *httpConfig) Dialect() string          { return h.dialect }
func (h *httpConfig) LogLevel() logrus.Level   { return logrus.InfoLevel }
func (h *httpConfig) SecureCookie() bool       { return h.secureCookie }
func (h *httpConfig) Development() bool        { return h.development }
func (h *httpConfig) CookieExchangeSecret() []byte {
	b, _ := base64.StdEncoding.DecodeString(h.cookieExchangeSecret)
	return b
}
func (h *httpConfig) RetentionPeriod() time.Duration { return h.retentionPeriod }
func (h *httpConfig) AccountUserSalt() []byte {
	b, _ := base64.StdEncoding.DecodeString(h.accountUserSalt)
	return b
}

func (h *httpConfig) Mailer() mailer.Mailer {
	if h.Development() {
		return localmailer.New()
	}
	user, pass, host := os.Getenv("SMTP_USER"), os.Getenv("SMTP_PASSWORD"), os.Getenv("SMTP_HOST")
	port, err := strconv.Atoi(os.Getenv("SMTP_PORT"))
	if err != nil {
		port = 587
	}
	return smtpmailer.New(host, user, pass, port)
}

const (
	defaultPort      = 8080
	defaultRetention = "4464h"
)

// New creates a new configuration for use in the context of AWS Lambda
func New() (config.Config, error) {
	cfg := httpConfig{
		port:                 defaultPort,
		dialect:              os.Getenv("DIALECT"),
		connectionString:     os.Getenv("CONNECTION_STRING"),
		secureCookie:         os.Getenv("SECURE_COOKIE") != "off",
		development:          os.Getenv("DEVELOPMENT") != "",
		cookieExchangeSecret: os.Getenv("COOKIE_EXCHANGE_SECRET"),
		accountUserSalt:      os.Getenv("ACCOUNT_USER_EMAIL_SALT"),
	}

	if override, ok := os.LookupEnv("PORT"); ok {
		asInt, err := strconv.Atoi(override)
		if err != nil {
			return nil, fmt.Errorf("config: error reading PORT value from environment: %v", err)
		}
		cfg.port = asInt
	}

	retention := os.Getenv("EVENT_RETENTION_PERIOD")
	if retention == "" {
		retention = defaultRetention
	}
	retentionPeriod, retentionErr := time.ParseDuration(retention)
	if retentionErr != nil {
		return nil, fmt.Errorf("config: error reading retention period: %v", retentionErr)
	}
	cfg.retentionPeriod = retentionPeriod

	return &cfg, nil
}
