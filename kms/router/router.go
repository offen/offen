package router

import (
	"errors"
	"net/http"

	"github.com/felixge/httpsnoop"
	"github.com/gorilla/mux"
	"github.com/m90/go-thunk"
	"github.com/offen/offen/kms/keymanager"
	httputil "github.com/offen/offen/kms/shared/http"
	"github.com/sirupsen/logrus"
)

type router struct {
	logger       *logrus.Logger
	manager      keymanager.Manager
	corsOrigin   string
	jwtPublicKey string
}

// Config is a function that adds config values to a router instance
type Config func(*router)

// WithCORSOrigin sets the origin header used for responding to CORS requests
func WithCORSOrigin(o string) Config {
	return func(r *router) {
		r.corsOrigin = o
	}
}

// WithManager defines the key mananger that will be used
func WithManager(m keymanager.Manager) Config {
	return func(r *router) {
		r.manager = m
	}
}

// WithLogger sets an optional logger for the router
func WithLogger(l *logrus.Logger) Config {
	return func(r *router) {
		r.logger = l
	}
}

// WithJWTPublicKey sets the URL for the auth server to be called
func WithJWTPublicKey(k string) Config {
	return func(r *router) {
		r.jwtPublicKey = k
	}
}

// New creates a new top-level application router for the KMS service using
// the given key manager and logger
func New(opts ...Config) http.Handler {
	rt := router{}
	for _, opt := range opts {
		opt(&rt)
	}

	json := httputil.ContentTypeMiddleware("application/json")
	cors := httputil.CorsMiddleware(rt.corsOrigin)
	recover := thunk.HandleSafelyWith(func(err error) {
		if rt.logger != nil {
			rt.logger.WithError(err).Error("Internal server error")
		}
	})

	m := mux.NewRouter()
	m.Use(recover, json, cors)

	decrypt := m.PathPrefix("/decrypt").Subrouter()
	if rt.jwtPublicKey != "" {
		auth := httputil.JWTProtect(rt.jwtPublicKey, "auth")
		decrypt.Use(auth)
	}

	decrypt.HandleFunc("", rt.handleDecrypt).Methods(http.MethodPost)
	m.HandleFunc("/encrypt", rt.handleEncrypt).Methods(http.MethodPost)

	m.NotFoundHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		httputil.RespondWithJSONError(w, errors.New("Not found"), http.StatusNotFound)
	})

	if rt.logger == nil {
		return m
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		metrics := httpsnoop.CaptureMetrics(m, w, r)
		rt.logger.WithFields(logrus.Fields{
			"status":   metrics.Code,
			"duration": metrics.Duration.Seconds(),
			"size":     metrics.Written,
		}).Infof("%s %s", r.Method, r.RequestURI)
	})
}

func (rt *router) logError(err error, message string) {
	if rt.logger != nil {
		rt.logger.WithError(err).Error(message)
	}
}
