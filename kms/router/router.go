package router

import (
	"net/http"

	"github.com/offen/offen/kms/keymanager"
	"github.com/sirupsen/logrus"
)

type router struct {
	logger  *logrus.Logger
	manager keymanager.Manager
}

// New creates a new top-level application router for the KMS service using
// the given key manager and logger
func New(manager keymanager.Manager, logger *logrus.Logger) http.Handler {
	return &router{logger: logger, manager: manager}
}

func (rt *router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/decrypt":
		rt.handleDecrypt(w, r)
	case "/encrypt":
		rt.handleEncrypt(w, r)
	case "/status":
		rt.handleStatus(w, r)
	default:
		http.NotFound(w, r)
	}
}

func (rt *router) logError(err error, message string) {
	if rt.logger != nil {
		rt.logger.WithError(err).Error(message)
	}
}
