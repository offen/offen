package http

import (
	"io/ioutil"
	"os"
	"strconv"

	"github.com/offen/offen/kms/config"
	"github.com/sirupsen/logrus"
)

type httpConfig struct {
	keyContent   string
	corsOrigin   string
	jwtPublicKey string
	logLevel     logrus.Level
	port         int
}

const (
	defaultLogLevel = logrus.InfoLevel
)

func (h *httpConfig) KeyContent() string     { return h.keyContent }
func (h *httpConfig) CorsOrigin() string     { return h.corsOrigin }
func (h *httpConfig) JWTPublicKey() string   { return h.jwtPublicKey }
func (h *httpConfig) LogLevel() logrus.Level { return h.logLevel }
func (h *httpConfig) Port() int              { return h.port }

// New creates a set of configuration values for running the KMS application
// as a HTTP server application. The defaults used are currently optimized for
// the local development setup.
func New() (config.Config, error) {
	cfg := httpConfig{
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
