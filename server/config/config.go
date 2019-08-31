package config

import (
	"time"

	"github.com/sirupsen/logrus"
)

// Config contains all runtime configuration for a deployment environment.
// Providers are free to implement the interface in any manner.
type Config interface {
	// the port the application binds to when run as a HTTP server
	Port() int
	// the connection string including credentials of the PostgreSQL
	// database to connect to
	ConnectionString() string
	// the severity level used for logging
	LogLevel() logrus.Level
	// whether to issue secure (HTTPS only) cookies
	SecureCookie() bool
	// the endpoint used for encrypting private keys when creating
	// a new account
	EncryptionEndpoint() string
	// a flag triggering certain development-only behavior like logging
	// SQL queries
	Development() bool
	// a secret string used for signing payloads when issueing optout cookies
	CookieExchangeSecret() string
	// the desired retention period of all event data
	RetentionPeriod() time.Duration
}
