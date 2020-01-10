package router

import (
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	defaultCSP             = "default-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'"
	revisionedJSRe         = regexp.MustCompile("-[0-9a-z]{10}\\.js$")
	webfontRe              = regexp.MustCompile("\\.(woff|woff2|ttf)$")
	scriptRe               = regexp.MustCompile("script\\.js$")
	defaultResponseHeaders = map[string]string{
		"Referrer-Policy":        "origin-when-cross-origin",
		"X-Content-Type-Options": "no-sniff",
		"X-XSS-Protection":       "1; mode=block",
	}
)

func staticMiddleware(fileServer http.Handler, SPARoots ...string) gin.HandlerFunc {
	tryServe := func(method, url string) (int, string) {
		r := httptest.NewRequest(method, url, nil)
		w := httptest.NewRecorder()
		fileServer.ServeHTTP(w, r)
		return w.Code, w.Header().Get("Content-Type")
	}

	return func(c *gin.Context) {
		var override *http.Request

		status, contentType := tryServe(c.Request.Method, c.Request.URL.String())
		if status == 404 {
			for _, root := range SPARoots {
				if strings.HasPrefix(c.Request.URL.String(), root) {
					override, _ = http.NewRequest(c.Request.Method, root, nil)
					break
				}
			}
		}

		if status == 404 && override == nil {
			c.Next()
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
		case scriptRe.MatchString(uri):
			c.Header("Cache-Control", "no-cache")
		}

		for key, value := range defaultResponseHeaders {
			c.Header(key, value)
		}

		if override != nil {
			fileServer.ServeHTTP(c.Writer, override)
		} else {
			fileServer.ServeHTTP(c.Writer, c.Request)
		}
	}
}
