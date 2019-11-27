package router

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-contrib/location"
	"github.com/gin-gonic/gin"
)

func secureContextMiddleware(contextKey string, isDevelopment bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		u := location.Get(c)
		isLocalhost := u.Hostname() == "localhost"
		c.Set(contextKey, !isLocalhost && !isDevelopment)
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
			).Pipe(c)
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
			).Pipe(c)
			return
		}

		var userID string
		if err := rt.cookieSigner.Decode(authKey, authCookie.Value, &userID); err != nil {
			authCookie, _ = rt.authCookie("", c.GetBool(contextKeySecureContext))
			http.SetCookie(c.Writer, authCookie)
			newJSONError(
				fmt.Errorf("error decoding cookie value: %v", err),
				http.StatusUnauthorized,
			).Pipe(c)
			return
		}

		user, userErr := rt.db.LookupUser(userID)
		if userErr != nil {
			authCookie, _ = rt.authCookie("", c.GetBool(contextKeySecureContext))
			http.SetCookie(c.Writer, authCookie)
			newJSONError(
				fmt.Errorf("user with id %s does not exist: %v", userID, userErr),
				http.StatusUnauthorized,
			).Pipe(c)
			return
		}
		c.Set(contextKey, user)
		c.Next()
	}
}
