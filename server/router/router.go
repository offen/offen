package router

import (
	"errors"
	"net/http"
	"time"

	"github.com/felixge/httpsnoop"
	"github.com/gorilla/mux"
	"github.com/m90/go-thunk"
	"github.com/offen/offen/server/persistence"
	httputil "github.com/offen/offen/server/shared/http"
	"github.com/sirupsen/logrus"
)

type router struct {
	db                 persistence.Database
	logger             *logrus.Logger
	secureCookie       bool
	optoutCookieDomain string
	userCookieDomain   string
	corsOrigin         string
	jwtPublicKey       string
}

func (rt *router) logError(err error, message string) {
	if rt.logger != nil {
		rt.logger.WithError(err).Error(message)
	}
}

type contextKey int

const (
	cookieKey                   = "user"
	optoutKey                   = "optout"
	authKey                     = "auth"
	authHeader                  = "X-RPC-Authentication"
	contextKeyCookie contextKey = iota
)

func (rt *router) userCookie(userID string) *http.Cookie {
	return &http.Cookie{
		Name:     cookieKey,
		Value:    userID,
		Expires:  time.Now().Add(time.Hour * 24 * 90),
		HttpOnly: true,
		Secure:   rt.secureCookie,
		Path:     "/",
	}
}

func (rt *router) optoutCookie(optout bool) *http.Cookie {
	c := &http.Cookie{
		Name:    optoutKey,
		Value:   "1",
		Expires: time.Now().Add(time.Hour * 24 * 365 * 100),
		Domain:  rt.optoutCookieDomain,
		Path:    "/",
		// this cookie is supposed to be read by the client so it can
		// stop operating before even sending requests
		HttpOnly: false,
	}
	if !optout {
		c.Expires = time.Unix(0, 0)
	}
	return c
}

// Config adds a configuration value to the router
type Config func(*router)

// WithDatabase sets the database the router will use
func WithDatabase(db persistence.Database) Config {
	return func(r *router) {
		r.db = db
	}
}

// WithLogger sets the logger the router will use
func WithLogger(l *logrus.Logger) Config {
	return func(r *router) {
		r.logger = l
	}
}

// WithSecureCookie determines whether the application will issue
// secure (HTTPS-only) cookies
func WithSecureCookie(sc bool) Config {
	return func(r *router) {
		r.secureCookie = sc
	}
}

// WithOptoutCookieDomain defines the domain `optout` cookies will use
func WithOptoutCookieDomain(cd string) Config {
	return func(r *router) {
		r.optoutCookieDomain = cd
	}
}

// WithCORSOrigin sets the CORS origin used on response headers
func WithCORSOrigin(o string) Config {
	return func(r *router) {
		r.corsOrigin = o
	}
}

// WithJWTPublicKey sets the endpoint to fetch the JWT Public Key
func WithJWTPublicKey(k string) Config {
	return func(r *router) {
		r.jwtPublicKey = k
	}
}

// New creates a new application router that reads and writes data
// to the given database implementation. In the context of the application
// this expects to be the only top level router in charge of handling all
// incoming HTTP requests.
func New(opts ...Config) http.Handler {
	rt := router{}
	for _, opt := range opts {
		opt(&rt)
	}
	m := mux.NewRouter()

	json := httputil.ContentTypeMiddleware("application/json")
	gif := httputil.ContentTypeMiddleware("image/gif")
	cors := httputil.CorsMiddleware(rt.corsOrigin)
	dropOptout := httputil.OptoutMiddleware(optoutKey)
	recovery := thunk.HandleSafelyWith(func(err error) {
		if rt.logger != nil {
			rt.logger.WithError(err).Error("Internal server error")
		}
	})
	userCookie := httputil.UserCookieMiddleware(cookieKey, contextKeyCookie)

	m.Use(recovery, cors)

	optout := m.PathPrefix("/opt-out").Subrouter()
	optout.Use(gif)
	optout.HandleFunc("", rt.optout).Methods(http.MethodGet)

	optin := m.PathPrefix("/opt-in").Subrouter()
	optin.Use(gif)
	optin.HandleFunc("", rt.optin).Methods(http.MethodGet)

	exchange := m.PathPrefix("/exchange").Subrouter()
	exchange.Use(json)
	exchange.HandleFunc("", rt.getPublicKey).Methods(http.MethodGet)
	exchange.HandleFunc("", rt.postUserSecret).Methods(http.MethodPost)

	getAuth := httputil.JWTProtect(rt.jwtPublicKey, authKey, authHeader, getAuthorizer)
	postAuth := httputil.JWTProtect(rt.jwtPublicKey, authKey, authHeader, postAuthorizer)
	accounts := m.PathPrefix("/accounts").Subrouter()
	accounts.Use(json)
	accounts.Handle("", getAuth(http.HandlerFunc(rt.getAccount))).Methods(http.MethodGet)
	accounts.Handle("", postAuth(http.HandlerFunc(rt.postAccount))).Methods(http.MethodPost)

	deleted := m.PathPrefix("/deleted").Subrouter()
	deleted.Use(json)
	deletedEventsForUser := userCookie(http.HandlerFunc(rt.getDeletedEvents))
	deleted.Handle("", deletedEventsForUser).Methods(http.MethodPost).Queries("user", "1")
	deleted.HandleFunc("", rt.getDeletedEvents).Methods(http.MethodPost)

	purge := m.PathPrefix("/purge").Subrouter()
	purge.Use(json, userCookie)
	purge.HandleFunc("", rt.purgeEvents).Methods(http.MethodPost)

	events := m.PathPrefix("/events").Subrouter()
	events.Use(json)
	events.Handle("", userCookie(http.HandlerFunc(rt.getEvents))).Methods(http.MethodGet)
	receiveEvents := dropOptout(http.HandlerFunc(rt.postEvents))
	events.Handle("", receiveEvents).Methods(http.MethodPost).Queries("anonymous", "1")
	events.Handle("", userCookie(receiveEvents)).Methods(http.MethodPost)

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
