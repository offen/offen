// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"context"
	"io/ioutil"
	"log"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	defaultCSP             = "default-src 'self'; style-src 'self' 'unsafe-inline'"
	revisionedJSRe         = regexp.MustCompile("-[0-9a-z]{10}\\.js$")
	webfontRe              = regexp.MustCompile("\\.(woff|woff2|ttf)$")
	scriptRe               = regexp.MustCompile("script\\.js$")
	stylesheetRe           = regexp.MustCompile("\\.css$")
	assetRe                = regexp.MustCompile("\\.svg$")
	defaultResponseHeaders = map[string]string{
		"Referrer-Policy":        "origin-when-cross-origin",
		"X-Content-Type-Options": "no-sniff",
		"X-XSS-Protection":       "1; mode=block",
	}
)

func muteRequest(r *http.Request) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), http.ServerContextKey, http.Server{
		ErrorLog: log.New(ioutil.Discard, "", log.LstdFlags),
	}))
}

func staticMiddleware(fileServer, fallback http.Handler) gin.HandlerFunc {
	tryStatic := func(method, url string) (int, string) {
		r := httptest.NewRequest(method, url, nil)
		r = muteRequest(r)
		w := httptest.NewRecorder()
		fileServer.ServeHTTP(w, r)
		return w.Code, w.Header().Get("Content-Type")
	}

	return func(c *gin.Context) {
		status, contentType := tryStatic(c.Request.Method, c.Request.URL.String())
		// Right now, we manually trigger an error when trying to read a directory
		// so we can skip the directory listings provided by the Go FileServer.
		// TODO: revisit this solution.
		if status == http.StatusNotFound || status == http.StatusInternalServerError {
			fallback.ServeHTTP(c.Writer, c.Request)
			return
		}

		if strings.HasPrefix(contentType, "text/html") {
			c.Header("Cache-Control", "no-cache")
			c.Header("Content-Security-Policy", defaultCSP)
		}

		switch uri := c.Request.URL.Path; {
		case revisionedJSRe.MatchString(uri), webfontRe.MatchString(uri):
			expires := time.Now().Add(time.Hour * 24 * 365).Format(time.RFC1123)
			c.Header("Expires", expires)
		case scriptRe.MatchString(uri), stylesheetRe.MatchString(uri), assetRe.MatchString(uri):
			c.Header("Cache-Control", "no-cache")
		}

		for key, value := range defaultResponseHeaders {
			c.Header(key, value)
		}
		fileServer.ServeHTTP(c.Writer, c.Request)
	}
}
