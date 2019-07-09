package http

import (
	"context"
	"errors"
	"net/http"
)

// CorsMiddleware ensures the wrapped handler will respond with proper CORS
// headers using the given origin.
func CorsMiddleware(origin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "POST,GET")
			w.Header().Set("Access-Control-Allow-Origin", origin)
			next.ServeHTTP(w, r)
		})
	}
}

// ContentTypeMiddleware ensuresthe wrapped handler will respond with a
// content type header of the given value.
func ContentTypeMiddleware(contentType string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Content-Type", contentType)
			next.ServeHTTP(w, r)
		})
	}
}

// OptoutMiddleware drops all requests to the given handler that are sent with
// a cookie of the given name,
func OptoutMiddleware(cookieName string) func(http.Handler) http.Handler {
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

// UserCookieMiddleware ensures a cookie of the given name is present and
// attaches its value to the request's context using the given key, before
// passing it on to the wrapped handler.
func UserCookieMiddleware(cookieKey string, contextKey interface{}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie(cookieKey)
			if err != nil {
				RespondWithJSONError(w, errors.New("user cookie: received no or blank identifier"), http.StatusBadRequest)
				return
			}
			r = r.WithContext(
				context.WithValue(r.Context(), contextKey, c.Value),
			)
			next.ServeHTTP(w, r)
		})
	}
}
