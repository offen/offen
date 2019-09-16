package router

import (
	"context"
	"errors"
	"fmt"
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

func (rt *router) accountUserMiddleware(cookieKey string, contextKey interface{}) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authCookie, authCookieErr := r.Cookie(cookieKey)
			if authCookieErr != nil {
				respondWithJSONError(w, errors.New("missing authentication token"), http.StatusUnauthorized)
				return
			}

			var userID string
			if err := rt.cookieSigner.Decode(authKey, authCookie.Value, &userID); err != nil {
				authCookie, _ = rt.authCookie("")
				http.SetCookie(w, authCookie)
				respondWithJSONError(w, fmt.Errorf("error decoding cookie value: %v", err), http.StatusUnauthorized)
				return
			}

			user, userErr := rt.db.LookupUser(userID)
			if userErr != nil {
				authCookie, _ = rt.authCookie("")
				http.SetCookie(w, authCookie)
				respondWithJSONError(w, fmt.Errorf("user with id %s does not exist: %v", userID, userErr), http.StatusNotFound)
			}
			r = r.WithContext(
				context.WithValue(r.Context(), contextKey, user),
			)
			next.ServeHTTP(w, r)
		})
	}
}
