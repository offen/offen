// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"bytes"
	"crypto/md5"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-contrib/location"
	"github.com/gin-gonic/gin"
)

func secureContextMiddleware(contextKey string, isDevelopment bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		u := location.Get(c)
		isLocalhost := u.Hostname() == "localhost"
		c.Set(contextKey, !isLocalhost && !isDevelopment)
	}
}

// optinMiddleware drops all requests to the given handler that are missing
// a consent cookie
func optinMiddleware(cookieName, passWhen string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if ck, err := c.Request.Cookie(cookieName); err != nil || ck.Value != passWhen {
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}
		c.Next()
	}
}

// cookieDuplexer ensures a cookie of the given name is present and
// attaches its value to the request's context using the given key, before
// passing it on to the wrapped handler. In case a second handler function
// is give, it will be called in case no cookie is present.
func cookieDuplexer(cookieKey, contextKey string) func(...duplexerOption) gin.HandlerFunc {
	return func(opts ...duplexerOption) gin.HandlerFunc {
		var defaultNotFoundHandler gin.HandlerFunc = func(c *gin.Context) {
			newJSONError(
				errors.New("cookie duplexer: received no or blank identifier"),
				http.StatusBadRequest,
			).Pipe(c)
		}
		var defaultFoundHandler gin.HandlerFunc = func(c *gin.Context) {
			newJSONError(
				errors.New("cookie duplexer: no handler configured"),
				http.StatusInternalServerError,
			).Pipe(c)
		}

		conf := duplexerConfig{
			found:    &defaultFoundHandler,
			notFound: &defaultNotFoundHandler,
		}
		for _, opt := range opts {
			opt(&conf)
		}

		return func(c *gin.Context) {
			cookie, err := c.Request.Cookie(cookieKey)
			if err != nil {
				(*conf.notFound)(c)
				return
			}
			c.Set(contextKey, cookie.Value)
			(*conf.found)(c)
		}
	}
}

type duplexerConfig struct {
	found    *gin.HandlerFunc
	notFound *gin.HandlerFunc
}

type duplexerOption func(*duplexerConfig)

func withCookieFound(h gin.HandlerFunc) duplexerOption {
	return func(c *duplexerConfig) {
		c.found = &h
	}
}

func withCookieNotFound(h gin.HandlerFunc) duplexerOption {
	return func(c *duplexerConfig) {
		c.notFound = &h
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

		user, userErr := rt.db.LookupAccountUser(userID)
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

func headerMiddleware(valueProvider map[string]func() string) gin.HandlerFunc {
	return func(c *gin.Context) {
		for key, provider := range valueProvider {
			c.Header(key, provider())
		}
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
		defer bw.ResponseWriter.Flush()
		c.Writer = bw
		c.Next()

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
	}
}
