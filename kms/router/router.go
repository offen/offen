package router

import (
	"errors"
	"net/http"
	"os"

	basicauth "github.com/m90/go-basicauth"
	"github.com/m90/go-thunk"
	"github.com/offen/offen/kms/keymanager"
	httputil "github.com/offen/offen/kms/shared/http"
	"github.com/sirupsen/logrus"
)

type router struct {
	logger  *logrus.Logger
	manager keymanager.Manager
}

func protect(handler http.HandlerFunc) http.HandlerFunc {
	withProtection := basicauth.With(basicauth.Credentials{
		User: "offen",
		Pass: os.Getenv("BASIC_AUTH_PASSWORD"),
	})(http.HandlerFunc(handler))
	return withProtection.ServeHTTP
}

// New creates a new top-level application router for the KMS service using
// the given key manager and logger
func New(manager keymanager.Manager, logger *logrus.Logger) http.Handler {
	router := &router{logger: logger, manager: manager}
	withContentType := httputil.ContentTypeMiddleware(router, "application/json")
	withCors := httputil.CorsMiddleware(withContentType, "https://local.offen.dev:9977")
	withRecover := thunk.HandleSafelyWith(func(err error) {
		logger.WithError(err).Error("internal server error")
	})(withCors)
	return withRecover
}

func (rt *router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/decrypt":
		protect(rt.handleDecrypt)(w, r)
	case "/encrypt":
		rt.handleEncrypt(w, r)
	case "/status":
		rt.handleStatus(w, r)
	default:
		httputil.RespondWithJSONError(w, errors.New("not found"), http.StatusNotFound)
	}
}

func (rt *router) logError(err error, message string) {
	if rt.logger != nil {
		rt.logger.WithError(err).Error(message)
	}
}
