package router

import (
	"errors"
	"net/http"

	basicauth "github.com/m90/go-basicauth"
	"github.com/m90/go-thunk"
	"github.com/offen/offen/kms/keymanager"
	httputil "github.com/offen/offen/kms/shared/http"
	"github.com/sirupsen/logrus"
)

type router struct {
	password string
	logger   *logrus.Logger
	manager  keymanager.Manager
}

func protect(handler http.HandlerFunc, password string) http.HandlerFunc {
	withProtection := basicauth.With(basicauth.Credentials{
		User: "offen",
		Pass: password,
	})(http.HandlerFunc(handler))
	return withProtection.ServeHTTP
}

// New creates a new top-level application router for the KMS service using
// the given key manager and logger
func New(origin string, manager keymanager.Manager, logger *logrus.Logger) http.Handler {
	router := &router{logger: logger, manager: manager}
	withContentType := httputil.ContentTypeMiddleware(router, "application/json")
	withCors := httputil.CorsMiddleware(withContentType, origin)
	withRecover := thunk.HandleSafelyWith(func(err error) {
		logger.WithError(err).Error("Internal server error")
	})(withCors)
	return withRecover
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
		httputil.RespondWithJSONError(w, errors.New("not found"), http.StatusNotFound)
	}
}

func (rt *router) logError(err error, message string) {
	if rt.logger != nil {
		rt.logger.WithError(err).Error(message)
	}
}
