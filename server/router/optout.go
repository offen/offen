package router

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/keys"
)

func serveCookieWithEmptyBody(c *gin.Context) {
	c.Header("Last-Modified", time.Now().UTC().Format(http.TimeFormat))
	c.Header("Cache-Control", "no-cache")
	c.Header("Pragma", "no-cache")
	c.Status(http.StatusNoContent)
}

const (
	scopeOptin  = "optin"
	scopeOptout = "optout"
)

func (rt *router) generateOneTimeAuth(scope string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authentication, err := keys.NewAuthentication(scope, rt.cookieExchangeSecret, time.Second*30)
		if err != nil {
			newJSONError(
				fmt.Errorf("router: error initiating authentication exchange: %v", err),
				http.StatusInternalServerError,
			).Respond(c)
			return
		}
		c.JSON(http.StatusOK, authentication)
	}
}

func (rt *router) postOptout(c *gin.Context) {
	rt.generateOneTimeAuth(scopeOptout)(c)
}

func (rt *router) postOptin(c *gin.Context) {
	rt.generateOneTimeAuth(scopeOptin)(c)
}

func (rt *router) validateOnetimeAuth(scope string, v url.Values) error {
	expires, expiresErr := strconv.ParseInt(v.Get("expires"), 10, 0)
	if expiresErr != nil {
		return expiresErr
	}
	requestAuth := keys.Authentication{
		Expires:   expires,
		Token:     v.Get("token"),
		Signature: v.Get("signature"),
	}
	return requestAuth.Validate(scope, rt.cookieExchangeSecret)
}

func (rt *router) getOptout(c *gin.Context) {
	if err := rt.validateOnetimeAuth(scopeOptout, c.Request.URL.Query()); err != nil {
		newJSONError(
			fmt.Errorf("router: credentials not valid: %v", err),
			http.StatusForbidden,
		).Respond(c)
		return
	}
	http.SetCookie(c.Writer, rt.optoutCookie(true))
	serveCookieWithEmptyBody(c)
}

func (rt *router) getOptin(c *gin.Context) {
	if err := rt.validateOnetimeAuth(scopeOptin, c.Request.URL.Query()); err != nil {
		newJSONError(
			fmt.Errorf("router: credentials not valid: %v", err),
			http.StatusForbidden,
		).Respond(c)
		return
	}
	http.SetCookie(c.Writer, rt.optoutCookie(false))
	serveCookieWithEmptyBody(c)
}
