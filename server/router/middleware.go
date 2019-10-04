package router

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// optoutMiddleware drops all requests to the given handler that are sent with
// a cookie of the given name,
func optoutMiddleware(cookieName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, err := c.Request.Cookie(cookieName); err == nil {
			c.Status(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

// userCookieMiddleware ensures a cookie of the given name is present and
// attaches its value to the request's context using the given key, before
// passing it on to the wrapped handler.
func userCookieMiddleware(cookieKey, contextKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		ck, err := c.Request.Cookie(cookieKey)
		if err != nil {
			newJSONError(
				errors.New("user cookie: received no or blank identifier"),
				http.StatusBadRequest,
			).Respond(c)
			return
		}
		c.Set(contextKey, ck.Value)
		c.Next()
	}
}

func (rt *router) accountUserMiddleware(cookieKey, contextKey string) gin.HandlerFunc {
	return func(c *gin.Context) {

		authCookie, authCookieErr := c.Request.Cookie(cookieKey)
		if authCookieErr != nil {
			newJSONError(
				errors.New("router: missing authentication token"),
				http.StatusUnauthorized,
			).Respond(c)
			return
		}

		var userID string
		if err := rt.cookieSigner.Decode(authKey, authCookie.Value, &userID); err != nil {
			authCookie, _ = rt.authCookie("")
			http.SetCookie(c.Writer, authCookie)
			newJSONError(
				fmt.Errorf("error decoding cookie value: %v", err),
				http.StatusUnauthorized,
			).Respond(c)
			return
		}

		user, userErr := rt.db.LookupUser(userID)
		if userErr != nil {
			authCookie, _ = rt.authCookie("")
			http.SetCookie(c.Writer, authCookie)
			newJSONError(
				fmt.Errorf("user with id %s does not exist: %v", userID, userErr),
				http.StatusNotFound,
			).Respond(c)
			return
		}
		c.Set(contextKey, user)
		c.Next()
	}
}
