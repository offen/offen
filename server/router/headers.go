package router

import (
	"bytes"
	"net/http"
	"regexp"
	"strings"
	"time"
)

type bufferingRw struct {
	http.ResponseWriter
	buf    bytes.Buffer
	status int
}

func (w *bufferingRw) WriteHeader(status int) {
	w.status = status
}

func (w *bufferingRw) Write(p []byte) (int, error) {
	return w.buf.Write(p)
}

var (
	revisionedJSRe         = regexp.MustCompile("-[0-9a-z]{10}\\.js$")
	webfontRe              = regexp.MustCompile("\\.(woff|woff2|ttf|eot)$")
	defaultResponseHeaders = map[string]string{
		"Referrer-Policy":        "origin-when-cross-origin",
		"X-Content-Type-Options": "no-sniff",
		"X-XSS-Protection":       "1; mode=block",
	}
)

func staticHeaderMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		bw := &bufferingRw{w, bytes.Buffer{}, http.StatusOK}
		next.ServeHTTP(bw, r)

		switch ct := w.Header().Get("Content-Type"); {
		case strings.HasPrefix(ct, "text/html"):
			w.Header().Set("Content-Security-Policy", "default-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'")
		}

		switch uri := r.URL.Path; {
		case revisionedJSRe.MatchString(uri), webfontRe.MatchString(uri):
			expires := time.Now().Add(time.Hour * 24 * 365).Format(time.RFC1123)
			w.Header().Set("Expires", expires)
		}

		for key, value := range defaultResponseHeaders {
			w.Header().Set(key, value)
		}

		w.Write(bw.buf.Bytes())
		w.WriteHeader(bw.status)
	})
}
