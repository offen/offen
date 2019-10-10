package router

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestJSONError(t *testing.T) {
	m := gin.New()
	m.GET("/", func(c *gin.Context) {
		newJSONError(
			errors.New("does not work"),
			http.StatusInternalServerError,
		).Pipe(c)
	})
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	m.ServeHTTP(w, r)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("Unexpected status code %d", w.Code)
	}
	if w.Body.String() != `{"error":"does not work","status":500}` {
		t.Errorf("Unexpected response body %s", w.Body.String())
	}
}
