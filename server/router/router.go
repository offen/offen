package router

import (
	"fmt"
	"html/template"
	"net/http"
	"time"

	"github.com/NYTimes/gziphandler"
	"github.com/felixge/httpsnoop"
	"github.com/gin-contrib/location"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/mailer"
	"github.com/offen/offen/server/persistence"
	"github.com/sirupsen/logrus"
)

type router struct {
	db           persistence.Service
	mailer       mailer.Mailer
	fs           http.FileSystem
	logger       *logrus.Logger
	cookieSigner *securecookie.SecureCookie
	template     *template.Template
	config       *config.Config
}

func (rt *router) logError(err error, message string) {
	if rt.logger != nil {
		rt.logger.WithError(err).Error(message)
	}
}

const (
	cookieKey               = "user"
	optinKey                = "consent"
	optinValue              = "allow"
	authKey                 = "auth"
	contextKeyCookie        = "contextKeyCookie"
	contextKeyAuth          = "contextKeyAuth"
	contextKeySecureContext = "contextKeySecure"
)

func (rt *router) userCookie(userID string, secure bool) *http.Cookie {
	sameSite := http.SameSiteNoneMode
	if !secure {
		sameSite = http.SameSiteLaxMode
	}

	c := &http.Cookie{
		Name:     cookieKey,
		Value:    userID,
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		Path:     "/api",
	}
	if userID != "" {
		c.Expires = time.Now().Add(config.EventRetention)
	}
	return c
}

func (rt *router) authCookie(userID string, secure bool) (*http.Cookie, error) {
	c := http.Cookie{
		Name:     authKey,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   secure,
		Path:     "/api",
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
func WithDatabase(db persistence.Service) Config {
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

// WithTemplate ensures the router is using the given template object
// for rendering dynamic HTML output.
func WithTemplate(t *template.Template) Config {
	return func(r *router) {
		r.template = t
	}
}

// WithConfig attaches the given runtime config to the router.
func WithConfig(c *config.Config) Config {
	return func(r *router) {
		r.config = c
	}
}

// WithFS attaches a filesystem for serving static assets
func WithFS(fs http.FileSystem) Config {
	return func(r *router) {
		r.fs = fs
	}
}

// WithMailer attaches a mailer for sending transactional email
func WithMailer(m mailer.Mailer) Config {
	return func(r *router) {
		r.mailer = m
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

	rt.cookieSigner = securecookie.New(rt.config.Secrets.CookieExchange.Bytes(), nil)

	optin := optinMiddleware(optinKey, optinValue)
	userCookie := userCookieMiddleware(cookieKey, contextKeyCookie)
	accountAuth := rt.accountUserMiddleware(authKey, contextKeyAuth)
	noStore := headerMiddleware(map[string]func() string{
		"Cache-Control": func() string {
			return "no-store"
		},
	})
	csp := headerMiddleware(map[string]func() string{
		"Content-Security-Policy": func() string {
			return defaultCSP
		},
	})
	etag := etagMiddleware()

	if !rt.config.App.Development {
		gin.SetMode(gin.ReleaseMode)
	}

	app := gin.New()
	app.Use(
		gin.Recovery(),
		location.Default(),
		secureContextMiddleware(contextKeySecureContext, rt.config.App.Development),
	)

	root := gin.New()
	root.SetHTMLTemplate(rt.template)
	root.GET("/*any", etag, csp, rt.getIndex)
	app.GET("/", gin.WrapH(root))

	app.Any("/healthz", noStore, rt.getHealth)
	app.GET("/versionz", noStore, rt.getVersion)
	{
		api := app.Group("/api")
		api.Use(noStore)
		api.GET("/exchange", rt.getPublicKey)
		api.POST("/exchange", rt.postUserSecret)

		api.GET("/accounts/:accountID", accountAuth, rt.getAccount)
		api.POST("/accounts", accountAuth, rt.postAccount)

		api.POST("/deleted/user", userCookie, rt.getDeletedEvents)
		api.POST("/deleted", rt.getDeletedEvents)
		api.POST("/purge", userCookie, rt.purgeEvents)

		api.GET("/login", accountAuth, rt.getLogin)
		api.POST("/login", rt.postLogin)
		api.POST("/logout", rt.postLogout)

		api.POST("/change-password", accountAuth, rt.postChangePassword)
		api.POST("/change-email", accountAuth, rt.postChangeEmail)
		api.POST("/forgot-password", rt.postForgotPassword)
		api.POST("/reset-password", rt.postResetPassword)
		api.POST("/invite/:accountID", accountAuth, rt.postInviteUser)
		api.POST("/invite", accountAuth, rt.postInviteUser)
		api.POST("/join", rt.postJoin)

		api.GET("/events", userCookie, rt.getEvents)
		api.POST("/events/anonymous", rt.postEvents)
		api.POST("/events", optin, userCookie, rt.postEvents)
	}

	fileServer := http.FileServer(rt.fs)
	if !rt.config.Server.ReverseProxy {
		fileServer = gziphandler.GzipHandler(fileServer)
	}

	app.Use(staticMiddleware(fileServer, root))

	if rt.config.Server.ReverseProxy {
		return app
	}

	// HTTP logging is only added when the reverse proxy setting is not
	// enabled
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		metrics := httpsnoop.CaptureMetrics(app, w, r)
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
