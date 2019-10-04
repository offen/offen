package router

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/mailer"
	"github.com/offen/offen/server/persistence"
	"github.com/sirupsen/logrus"
)

type router struct {
	db                   persistence.Database
	mailer               mailer.Mailer
	logger               *logrus.Logger
	cookieSigner         *securecookie.SecureCookie
	secureCookie         bool
	cookieExchangeSecret []byte
	retentionPeriod      time.Duration
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
		Expires:  time.Now().Add(rt.retentionPeriod),
		HttpOnly: true,
		Secure:   rt.secureCookie,
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
		r.secureCookie = sc
	}
}

// WithCookieExchangeSecret sets the secret to be used for signing secured
// cookie exchange requests
func WithCookieExchangeSecret(b []byte) Config {
	return func(r *router) {
		r.cookieExchangeSecret = b
	}
}

// WithRetentionPeriod sets the expected value for retaining event data
func WithRetentionPeriod(d time.Duration) Config {
	return func(r *router) {
		r.retentionPeriod = d
	}
}

// New creates a new application router that reads and writes data
// to the given database implementation. In the context of the application
// this expects to be the only top level router in charge of handling all
// incoming HTTP requests.
func New(opts ...Config) *gin.Engine {
	rt := router{}
	for _, opt := range opts {
		opt(&rt)
	}
	rt.cookieSigner = securecookie.New(rt.cookieExchangeSecret, nil)

	m := gin.New()
	m.Use(gin.Recovery())

	m.GET("/healthz", rt.getHealth)

	m.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Index page TBD")
	})

	m.StaticFS("/vault", http.Dir("./public/vault"))
	m.StaticFile("/script.js", "./public/script.js")

	{
		auditorium := gin.New()
		auditorium.StaticFS("/auditorium", http.Dir("./public/auditorium"))
		auditorium.NoRoute(func(c *gin.Context) {
			c.Status(http.StatusOK)
			c.File("./public/auditorium/index.html")
		})
		m.Any("/auditorium/*delegateToClientRouter", auditorium.HandleContext)
	}

	dropOptout := optoutMiddleware(optoutKey)
	userCookie := userCookieMiddleware(cookieKey, contextKeyCookie)
	accountAuth := rt.accountUserMiddleware(authKey, contextKeyAuth)

	api := m.Group("/api")
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

	m.NoRoute(func(c *gin.Context) {
		c.String(http.StatusNotFound, "404 - Not found")
	})
	return m
}
