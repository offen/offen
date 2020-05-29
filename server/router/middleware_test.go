// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/persistence"
)

func TestOptinMiddleware(t *testing.T) {
	m := gin.New()
	m.GET("/", optinMiddleware("consent", "allow"), func(c *gin.Context) {
		c.String(http.StatusOK, "hey there")
	})
	t.Run("no cookie", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		m.ServeHTTP(w, r)

		if w.Code != http.StatusNoContent {
			t.Errorf("Unexpected status code %d", w.Code)
		}

		if w.Body.String() != "" {
			t.Errorf("Unexpected response body %s", w.Body.String())
		}
	})
	t.Run("explicit denial", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "consent",
			Value: "deny",
		})
		m.ServeHTTP(w, r)

		if w.Code != http.StatusNoContent {
			t.Errorf("Unexpected status code %d", w.Code)
		}

		if w.Body.String() != "" {
			t.Errorf("Unexpected response body %s", w.Body.String())
		}
	})
	t.Run("explicit allow", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "consent",
			Value: "allow",
		})
		m.ServeHTTP(w, r)

		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %d", w.Code)
		}

		if w.Body.String() != "hey there" {
			t.Errorf("Unexpected response body %s", w.Body.String())
		}
	})
}

func TestUserCookieMiddleware(t *testing.T) {
	m := gin.New()
	rt := router{}
	m.GET("/", rt.userCookieMiddleware("user", "1"), func(c *gin.Context) {
		value := c.Value("1")
		c.String(http.StatusOK, "value is %v", value)
	})
	t.Run("no cookie", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		m.ServeHTTP(w, r)
		if w.Code != http.StatusBadRequest {
			t.Errorf("Unexpected status code %v", w.Code)
		}
		if !strings.Contains(w.Body.String(), "received no or blank identifier") {
			t.Errorf("Unexpected body %s", w.Body.String())
		}
	})

	t.Run("invalid identifier", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "user",
			Value: "xyz",
		})
		m.ServeHTTP(w, r)
		if w.Code != http.StatusBadRequest {
			t.Errorf("Unexpected status code %v", w.Code)
		}
		if !strings.Contains(w.Body.String(), "received invalid identifier") {
			t.Errorf("Unexpected body %s", w.Body.String())
		}
	})

	t.Run("ok", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "user",
			Value: "600bf860-0477-423b-85e3-d5472c99230e",
		})
		m.ServeHTTP(w, r)
		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}
		if w.Body.String() != "value is 600bf860-0477-423b-85e3-d5472c99230e" {
			t.Errorf("Unexpected body %s", w.Body.String())
		}
	})
}

type mockUserLookupDatabase struct {
	persistence.Service
}

func (*mockUserLookupDatabase) LookupAccountUser(accountUserID string) (persistence.LoginResult, error) {
	if accountUserID == "account-user-id-1" {
		return persistence.LoginResult{
			AccountUserID: "account-user-id-1",
		}, nil
	}
	return persistence.LoginResult{}, fmt.Errorf("account user with id %s not found", accountUserID)
}

func TestAccountUserMiddleware(t *testing.T) {
	cookieSigner := securecookie.New([]byte("keyboard cat"), nil)
	rt := router{
		authenticationSigner: cookieSigner,
		db:                   &mockUserLookupDatabase{},
	}
	m := gin.New()
	m.GET("/", rt.accountUserMiddleware("auth", "1"), func(c *gin.Context) {
		user, _ := c.Value("2").(persistence.LoginResult)
		c.String(http.StatusOK, "user id is %v", user.AccountUserID)
	})

	t.Run("no cookie", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		m.ServeHTTP(w, r)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})

	t.Run("bad cookie", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "auth",
			Value: "somethingsomething",
		})
		m.ServeHTTP(w, r)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})

	t.Run("bad db lookup", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		cookieValue, _ := cookieSigner.Encode("auth", "account-user-id-2")
		r.AddCookie(&http.Cookie{
			Name:  "auth",
			Value: cookieValue,
		})
		m.ServeHTTP(w, r)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})

	t.Run("ok", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		cookieValue, _ := cookieSigner.Encode("auth", "account-user-id-1")
		r.AddCookie(&http.Cookie{
			Name:  "auth",
			Value: cookieValue,
		})
		m.ServeHTTP(w, r)
		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})
}

func TestHeaderMiddleware(t *testing.T) {
	m := gin.New()
	m.GET("/", headerMiddleware(map[string]func() string{
		"Cache-Control": func() string {
			return "no-store"
		},
		"X-Test": func() string {
			return time.Now().String()
		},
	}), func(c *gin.Context) {
		c.String(http.StatusOK, "OK!")
	})

	r := httptest.NewRequest(http.MethodGet, "/", nil)
	w1, w2 := httptest.NewRecorder(), httptest.NewRecorder()

	m.ServeHTTP(w1, r)

	if w1.Code != http.StatusOK {
		t.Errorf("Unexpected status code %v", w1.Code)
	}

	if v := w1.HeaderMap["Cache-Control"]; v[0] != "no-store" {
		t.Errorf("Unexpected cache control header %v", v[0])
	}

	m.ServeHTTP(w2, r)

	if w2.Code != http.StatusOK {
		t.Errorf("Unexpected status code %v", w2.Code)
	}

	if v := w2.HeaderMap["Cache-Control"]; v[0] != "no-store" {
		t.Errorf("Unexpected cache control header %v", v[0])
	}

	test1, test2 := w1.HeaderMap["X-Test"], w2.HeaderMap["X-Test"]
	if test1[0] == test2[0] {
		t.Errorf("Unexpectedly received %v twice", test1[0])
	}
}

func TestEtagMiddleware(t *testing.T) {
	m := gin.New()
	m.GET("/", etagMiddleware(), func(c *gin.Context) {
		c.String(http.StatusOK, "OK this is the content!")
	})

	w1 := httptest.NewRecorder()
	r1 := httptest.NewRequest(http.MethodGet, "/", nil)

	m.ServeHTTP(w1, r1)

	if w1.Code != http.StatusOK {
		t.Errorf("Unexpected status code %v", w1.Code)
	}

	if cacheControl := w1.Header().Get("Cache-Control"); cacheControl != "no-cache" {
		t.Errorf("Unexpected cache control header %v", cacheControl)
	}

	etag := w1.Header().Get("Etag")
	if etag == "" {
		t.Fatal("No Etag header sent in response")
	}

	w2 := httptest.NewRecorder()
	r2 := httptest.NewRequest(http.MethodGet, "/", nil)
	r2.Header["If-None-Match"] = []string{etag}

	m.ServeHTTP(w2, r2)

	if w2.Code != http.StatusOK {
		t.Errorf("Unexpected status code %v", w2.Code)
	}
}
