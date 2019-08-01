package router

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRouter_optout(t *testing.T) {
	rt := router{
		optoutCookieDomain:   "test.offen.dev",
		cookieExchangeSecret: []byte("top-secret"),
	}
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	rt.postOptoutOptin(w, r)

	cookies := w.Result().Cookies()
	if len(cookies) != 0 {
		t.Errorf("Expected no cookies to be sent in first response, got %d", len(cookies))
	}

	a := struct {
		Expires   int64  `json:"expires"`
		Signature string `json:"signature"`
		Token     string `json:"token"`
	}{}
	b, _ := ioutil.ReadAll(w.Body)
	json.Unmarshal(b, &a)

	w2 := httptest.NewRecorder()
	r2 := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/?expires=%d&signature=%s&token=%s", a.Expires, a.Signature, a.Token), nil)
	rt.getOptout(w2, r2)

	if w2.Code != http.StatusNoContent {
		t.Fatalf("Unexpected status code %v", w2.Code)
	}

	cookies = w2.Result().Cookies()
	if len(cookies) != 1 {
		t.Errorf("Expected 1 cookies to be sent in second response, got %d", len(cookies))
	}

	cookie := cookies[0]
	if cookie.Name != "optout" {
		t.Errorf("Unexpected cookie name %s", cookie.Name)
	}

	if cookie.Domain != "test.offen.dev" {
		t.Errorf("Unexpected cookie domain %s", cookie.Domain)
	}
}
