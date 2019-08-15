package config

import "github.com/sirupsen/logrus"

// Config gathers all configuration values that can be set when running
// the KMS application. Each possible runtime is supposed to implement the
// interface by itself.
type Config interface {
	// returns the content of the key currently used for encrypting and decrypting
	KeyContent() string
	// the origin value sent in CORS headers
	CorsOrigin() string
	// the location (URL) of the public key used for signing authorization JWTs
	JWTPublicKey() string
	// the application's log level
	LogLevel() logrus.Level
	// the port the application binds to when running as a server app
	Port() int
}
