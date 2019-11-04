package router

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/config"
)

func TestRouter_optout(t *testing.T) {
	rt := router{
		config: &config.Config{},
	}
	rt.config.Secrets.CookieExchange = config.Bytes([]byte("top-secret"))
	m := gin.New()
	m.POST("/", rt.postOptout)
	m.GET("/", rt.getOptout)
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	m.ServeHTTP(w, r)

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

	m.ServeHTTP(w2, r2)

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
}
