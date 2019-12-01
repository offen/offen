package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestStaticMiddleware(t *testing.T) {
	m := gin.New()
	fileServer := http.FileServer(http.Dir("./testdata"))

	middleware := staticMiddleware(fileServer, "/spa/")

	m.Use(middleware)

	{
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)

		m.ServeHTTP(w, r)

		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}

		if !strings.HasPrefix(w.Header().Get("Content-Type"), "text/html") {
			t.Errorf("Unexpected Content-Type %v", w.Header().Get("Content-Type"))
		}

		if w.Header().Get("Content-Security-Policy") == "" {
			t.Error("Unexpected empty CSP header")
		}
	}

	{
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/unknown/thing", nil)

		m.ServeHTTP(w, r)

		if w.Code != http.StatusNotFound {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	}

	{
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/script.js", nil)

		m.ServeHTTP(w, r)

		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}

		if w.Header().Get("Expires") != "" {
			t.Errorf("Unexpected expires header on unrevisioned asset %v", w.Header().Get("Expires"))
		}
	}

	{
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/vendor-ab21bef31c.js", nil)

		m.ServeHTTP(w, r)

		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}

		if w.Header().Get("Expires") == "" {
			t.Error("Unexpected empty Expires header on revisioned asset")
		}
	}

	{
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/spa/", nil)

		m.ServeHTTP(w, r)

		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}

		if !strings.HasPrefix(w.Header().Get("Content-Type"), "text/html") {
			t.Errorf("Unexpected Content-Type %v", w.Header().Get("Content-Type"))
		}
	}

	{
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/spa/handled/by/client/router?param=12", nil)

		m.ServeHTTP(w, r)

		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}

		if !strings.HasPrefix(w.Header().Get("Content-Type"), "text/html") {
			t.Errorf("Unexpected Content-Type %v", w.Header().Get("Content-Type"))
		}
	}
}
