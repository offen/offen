package router

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type rwWithStatus struct {
	http.ResponseWriter
	status int
}

func (w *rwWithStatus) WriteHeader(status int) {
	w.status = status // Store the status for our own use
	if status != http.StatusNotFound {
		w.ResponseWriter.WriteHeader(status)
	}
}

func (w *rwWithStatus) Write(p []byte) (int, error) {
	if w.status != http.StatusNotFound {
		return w.ResponseWriter.Write(p)
	}
	return len(p), nil // Lie that we successfully written it
}

func singlePageAppMiddleware(root string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			withStatus := &rwWithStatus{w, 0}
			next.ServeHTTP(withStatus, r)
			if withStatus.status == http.StatusNotFound {
				replacement, _ := http.NewRequest(r.Method, root, nil)
				w.Header().Set("Content-Type", "text/html")
				next.ServeHTTP(w, replacement)
			}
		})
	}
}

// optoutMiddleware drops all requests to the given handler that are sent with
// a cookie of the given name,
func optoutMiddleware(cookieName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if _, err := c.Request.Cookie(cookieName); err == nil {
			c.Status(http.StatusNoContent)
			c.Abort()
			return
		}
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
				http.StatusNotFound,
			).Pipe(c)
			return
		}
		c.Set(contextKey, user)
		c.Next()
	}
}
