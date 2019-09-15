package router

import (
	"context"
	"errors"
	"net/http"
)

// optoutMiddleware drops all requests to the given handler that are sent with
// a cookie of the given name,
func optoutMiddleware(cookieName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if _, err := r.Cookie(cookieName); err == nil {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// userCookieMiddleware ensures a cookie of the given name is present and
// attaches its value to the request's context using the given key, before
// passing it on to the wrapped handler.
func userCookieMiddleware(cookieKey string, contextKey interface{}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie(cookieKey)
			if err != nil {
				respondWithJSONError(w, errors.New("user cookie: received no or blank identifier"), http.StatusBadRequest)
				return
			}
			r = r.WithContext(
				context.WithValue(r.Context(), contextKey, c.Value),
			)
			next.ServeHTTP(w, r)
		})
	}
}
