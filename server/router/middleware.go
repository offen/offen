package router

import (
	"bytes"
	"crypto/md5"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

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
			authCookie, _ = rt.authCookie("")
			http.SetCookie(c.Writer, authCookie)
			newJSONError(
				fmt.Errorf("error decoding cookie value: %v", err),
				http.StatusUnauthorized,
			).Pipe(c)
			return
		}

		user, userErr := rt.db.LookupUser(userID)
		if userErr != nil {
			authCookie, _ = rt.authCookie("")
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

func cacheControlMiddleware(valueProvider func() string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Cache-Control", valueProvider())
		c.Next()
	}
}

type bufferingGinWriter struct {
	gin.ResponseWriter
	buf bytes.Buffer
}

func (g *bufferingGinWriter) Write(data []byte) (int, error) {
	return g.buf.Write(data)
}

func etagMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		bw := &bufferingGinWriter{c.Writer, bytes.Buffer{}}
		c.Writer = bw
		defer func() {
			data := bw.buf.Bytes()
			etag := fmt.Sprintf("%x", md5.Sum(data))
			c.Header("Etag", etag)
			c.Header("Cache-Control", "no-cache")
			if match := c.GetHeader("If-None-Match"); match != "" {
				if strings.Contains(match, etag) {
					c.Status(http.StatusNotModified)
					return
				}
			}
			bw.ResponseWriter.Write(data)
			bw.ResponseWriter.Flush()
		}()
		c.Next()
	}
}
