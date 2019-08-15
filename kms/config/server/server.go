package server

import (
	"io/ioutil"
	"os"
	"strconv"

	"github.com/offen/offen/kms/config"
	"github.com/sirupsen/logrus"
)

type serverConfig struct {
	keyContent   string
	corsOrigin   string
	jwtPublicKey string
	logLevel     logrus.Level
	port         int
}

const (
	defaultLogLevel = logrus.InfoLevel
)

func (s *serverConfig) KeyContent() string     { return s.keyContent }
func (s *serverConfig) CorsOrigin() string     { return s.corsOrigin }
func (s *serverConfig) JWTPublicKey() string   { return s.jwtPublicKey }
func (s *serverConfig) LogLevel() logrus.Level { return s.logLevel }
func (s *serverConfig) Port() int              { return s.port }

// New creates a set of configuration values for running the KMS application
// as a HTTP server application. The defaults used are currently optimized for
// the local development setup.
func New() (config.Config, error) {
	cfg := serverConfig{
		logLevel: defaultLogLevel,
	}

	if override, ok := os.LookupEnv("PORT"); ok {
		asInt, err := strconv.Atoi(override)
		if err != nil {
			return nil, err
		}
		cfg.port = asInt
	}

	if override, ok := os.LookupEnv("CORS_ORIGIN"); ok {
		cfg.corsOrigin = override
	}

	if override, ok := os.LookupEnv("JWT_PUBLIC_KEY"); ok {
		cfg.jwtPublicKey = override
	}

	keyContent, keyErr := ioutil.ReadFile(os.Getenv("KEY_FILE"))
	if keyErr != nil {
		return nil, keyErr
	}
	cfg.keyContent = string(keyContent)

	return &cfg, nil
}
