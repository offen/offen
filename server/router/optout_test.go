package router

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRouter_optout(t *testing.T) {
	rt := router{
		optoutCookieDomain: "test.offen.dev",
	}
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	rt.optout(w, r)

	cookies := w.Result().Cookies()
	if len(cookies) != 1 {
		t.Errorf("Expected 1 cookie to be present in the response, got %d", len(cookies))
	}

	cookie := cookies[0]
	if cookie.Name != "optout" {
		t.Errorf("Unexpected cookie name %s", cookie.Name)
	}

	if cookie.Domain != "test.offen.dev" {
		t.Errorf("Unexpected cookie domain %s", cookie.Domain)
	}
}
