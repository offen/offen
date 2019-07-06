package http

import (
	"context"
	"errors"
	"net/http"
)

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

func ContentTypeMiddleware(contentType string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Add("Content-Type", contentType)
			next.ServeHTTP(w, r)
		})
	}
}

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

func UserCookieMiddleware(cookieKey string, contextKey interface{}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c, err := r.Cookie(cookieKey)
			if err != nil {
				RespondWithJSONError(w, err, http.StatusBadRequest)
				return
			}
			if c.Value == "" {
				RespondWithJSONError(w, errors.New("received blank user identifier"), http.StatusBadRequest)
				return
			}
			r = r.WithContext(
				context.WithValue(r.Context(), contextKey, c.Value),
			)
			next.ServeHTTP(w, r)
		})
	}
}
