package router

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCorsMiddleware(t *testing.T) {
	t.Run("default", func(t *testing.T) {
		wrapped := corsMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("OK"))
		}))
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.Header.Set("Origin", "https://www.example.net")
		wrapped.ServeHTTP(w, r)
		if h := w.Header().Get("Access-Control-Allow-Origin"); h != "https://www.example.net" {
			t.Errorf("Unexpected header value %v", h)
		}
	})
}

func TestContentTypeMiddleware(t *testing.T) {
	t.Run("default", func(t *testing.T) {
		wrapped := contentTypeMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("OK"))
		}))
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		wrapped.ServeHTTP(w, r)
		if h := w.Header().Get("Content-Type"); h != "application/json" {
			t.Errorf("Unexpected header value %v", h)
		}
	})
}
