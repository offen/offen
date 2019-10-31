package router

import (
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/felixge/httpsnoop"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/assets"
	"github.com/offen/offen/server/mailer"
	"github.com/offen/offen/server/persistence"
	"github.com/sirupsen/logrus"
)

type router struct {
	db           persistence.Database
	mailer       mailer.Mailer
	logger       *logrus.Logger
	cookieSigner *securecookie.SecureCookie
	template     *template.Template
	settings     struct {
		cookieExchangeSecret []byte
		secureCookie         bool
		revision             string
		development          bool
		reverseProxy         bool
		retentionPeriod      time.Duration
		rootAccount          string
	}
}

func (rt *router) logError(err error, message string) {
	if rt.logger != nil {
		rt.logger.WithError(err).Error(message)
	}
}

const (
	cookieKey        = "user"
	optoutKey        = "optout"
	authKey          = "auth"
	contextKeyCookie = "contextKeyCookie"
	contextKeyAuth   = "contextKeyAuth"
)

func (rt *router) userCookie(userID string) *http.Cookie {
	return &http.Cookie{
		Name:     cookieKey,
		Value:    userID,
		Expires:  time.Now().Add(rt.settings.retentionPeriod),
		HttpOnly: true,
		Secure:   rt.settings.secureCookie,
		Path:     "/",
	}
}

func (rt *router) optoutCookie(optout bool) *http.Cookie {
	c := &http.Cookie{
		Name:  optoutKey,
		Value: "1",
		// the optout cookie is supposed to outlive the software, so
		// it expires in ~100 years
		Expires: time.Now().Add(time.Hour * 24 * 365 * 100),
		Path:    "/",
		// this cookie is supposed to be read by the client so it can
		// stop operating before even sending requests
		HttpOnly: false,
		SameSite: http.SameSiteDefaultMode,
	}
	if !optout {
		c.Expires = time.Unix(0, 0)
	}
	return c
}

func (rt *router) authCookie(userID string) (*http.Cookie, error) {
	c := http.Cookie{
		Name:     authKey,
		HttpOnly: true,
		SameSite: http.SameSiteDefaultMode,
	}
	if userID == "" {
		c.Expires = time.Unix(0, 0)
	} else {
		value, err := rt.cookieSigner.MaxAge(24*60*60).Encode(authKey, userID)
		if err != nil {
			return nil, err
		}
		c.Value = value
	}
	return &c, nil

}

// Config adds a configuration value to the router
type Config func(*router)

// WithDatabase sets the database the router will use
func WithDatabase(db persistence.Database) Config {
	return func(r *router) {
		r.db = db
	}
}

// WithRevision sets the current revision
func WithRevision(rev string) Config {
	return func(r *router) {
		r.settings.revision = rev
	}
}

// WithLogger sets the logger the router will use
func WithLogger(l *logrus.Logger) Config {
	return func(r *router) {
		r.logger = l
	}
}

// WithMailer sets the mailer the router will use
func WithMailer(m mailer.Mailer) Config {
	return func(r *router) {
		r.mailer = m
	}
}

// WithSecureCookie determines whether the application will issue
// secure (HTTPS-only) cookies
func WithSecureCookie(sc bool) Config {
	return func(r *router) {
		r.settings.secureCookie = sc
	}
}

// WithCookieExchangeSecret sets the secret to be used for signing secured
// cookie exchange requests
func WithCookieExchangeSecret(b []byte) Config {
	return func(r *router) {
		r.settings.cookieExchangeSecret = b
	}
}

// WithRootAccount sets the ID of the root account to be used
func WithRootAccount(id string) Config {
	return func(r *router) {
		r.settings.rootAccount = id
	}
}

// WithRetentionPeriod sets the expected value for retaining event data
func WithRetentionPeriod(d time.Duration) Config {
	return func(r *router) {
		r.settings.retentionPeriod = d
	}
}

// WithDevelopmentMode specifies whether the router is expected to
func WithDevelopmentMode(d bool) Config {
	return func(r *router) {
		r.settings.development = d
	}
}

// WithReverseProxy determines whether the router will assume it is exposed
// to the internet directly, or if it's behind a reverse proxy.
func WithReverseProxy(p bool) Config {
	return func(r *router) {
		r.settings.reverseProxy = p
	}
}

func WithTemplate(t *template.Template) Config {
	return func(r *router) {
		r.template = t
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
	rt.cookieSigner = securecookie.New(rt.settings.cookieExchangeSecret, nil)

	fileServer := http.FileServer(assets.FS)
	if !rt.settings.reverseProxy {
		fileServer = gziphandler.GzipHandler(staticHeaderMiddleware(fileServer))
	}

	static := http.NewServeMux()
	// In development, these routes will be served by a different nginx
	// upstream. They are only relevant when building the application into
	// a single binary that inlines the filesystems.
	static.Handle("/auditorium/", singlePageAppMiddleware("/auditorium/")(fileServer))
	static.Handle("/", fileServer)

	dropOptout := optoutMiddleware(optoutKey)
	userCookie := userCookieMiddleware(cookieKey, contextKeyCookie)
	accountAuth := rt.accountUserMiddleware(authKey, contextKeyAuth)

	if !rt.settings.development {
		gin.SetMode(gin.ReleaseMode)
	}

	app := gin.New()
	app.Use(gin.Recovery())
	if rt.template != nil {
		app.SetHTMLTemplate(rt.template)
	}
	app.GET("/", rt.getRoot)
	app.GET("/healthz", rt.getHealth)
	app.GET("/versionz", rt.getVersion)
	{
		api := app.Group("/api")
		api.GET("/opt-out", rt.getOptout)
		api.POST("/opt-in", rt.postOptin)
		api.GET("/opt-in", rt.getOptin)
		api.POST("/opt-out", rt.postOptout)

		api.GET("/exchange", rt.getPublicKey)
		api.POST("/exchange", rt.postUserSecret)

		api.GET("/accounts/:accountID", accountAuth, rt.getAccount)

		api.POST("/deleted/user", userCookie, rt.getDeletedEvents)
		api.POST("/deleted", rt.getDeletedEvents)
		api.POST("/purge", userCookie, rt.purgeEvents)

		api.GET("/login", accountAuth, rt.getLogin)
		api.POST("/login", rt.postLogin)

		api.POST("/change-password", accountAuth, rt.postChangePassword)
		api.POST("/change-email", accountAuth, rt.postChangeEmail)
		api.POST("/forgot-password", rt.postForgotPassword)
		api.POST("/reset-password", rt.postResetPassword)

		api.GET("/events", userCookie, rt.getEvents)
		api.POST("/events/anonymous", dropOptout, rt.postEvents)
		api.POST("/events", dropOptout, userCookie, rt.postEvents)
	}

	m := http.NewServeMux()
	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		switch uri := r.URL.Path; {
		case strings.HasPrefix(uri, "/api/"),
			strings.HasPrefix(uri, "/healthz"),
			strings.HasPrefix(uri, "/versionz"),
			uri == "/":
			app.ServeHTTP(w, r)
		default:
			static.ServeHTTP(w, r)
		}
	})

	if rt.settings.reverseProxy {
		return m
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		metrics := httpsnoop.CaptureMetrics(m, w, r)
		logLevel := logrus.InfoLevel
		if metrics.Code >= http.StatusInternalServerError {
			logLevel = logrus.ErrorLevel
		}
		rt.logger.WithFields(logrus.Fields{
			"status":   metrics.Code,
			"duration": fmt.Sprintf("%3f", metrics.Duration.Seconds()),
			"size":     metrics.Written,
			"method":   r.Method,
			"uri":      r.RequestURI,
		}).Logf(logLevel, "%s %s", r.Method, r.URL.Path)
	})
}
