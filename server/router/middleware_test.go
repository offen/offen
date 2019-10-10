package router

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/persistence"
)

func TestOptoutMiddleware(t *testing.T) {
	m := gin.New()
	m.GET("/", optoutMiddleware("optout"), func(c *gin.Context) {
		c.String(http.StatusOK, "hey there")
	})
	t.Run("with cookie", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "optout",
			Value: "1",
		})
		m.ServeHTTP(w, r)

		if w.Code != http.StatusNoContent {
			t.Errorf("Unexpected status code %d", w.Code)
		}

		if w.Body.String() != "" {
			t.Errorf("Unexpected response body %s", w.Body.String())
		}
	})
	t.Run("no cookie", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
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
	m.GET("/", userCookieMiddleware("user", "1"), func(c *gin.Context) {
		value := c.Value("1")
		c.String(http.StatusOK, fmt.Sprintf("value is %v", value))
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

	t.Run("no value", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		m.ServeHTTP(w, r)
		r.AddCookie(&http.Cookie{
			Name:  "user",
			Value: "",
		})
		if w.Code != http.StatusBadRequest {
			t.Errorf("Unexpected status code %v", w.Code)
		}
		if !strings.Contains(w.Body.String(), "received no or blank identifier") {
			t.Errorf("Unexpected body %s", w.Body.String())
		}
	})

	t.Run("ok", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.AddCookie(&http.Cookie{
			Name:  "user",
			Value: "token",
		})
		m.ServeHTTP(w, r)
		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}
		if w.Body.String() != "value is token" {
			t.Errorf("Unexpected body %s", w.Body.String())
		}
	})
}

type mockUserLookupDatabase struct {
	persistence.Database
}

func (*mockUserLookupDatabase) LookupUser(userID string) (persistence.LoginResult, error) {
	if userID == "account-user-id-1" {
		return persistence.LoginResult{
			UserID: "account-user-id-1",
		}, nil
	}
	return persistence.LoginResult{}, fmt.Errorf("account user with id %s not found", userID)
}

func TestAccountUserMiddleware(t *testing.T) {
	cookieSigner := securecookie.New([]byte("keyboard cat"), nil)
	rt := router{
		cookieSigner: cookieSigner,
		db:           &mockUserLookupDatabase{},
	}

	m := gin.New()
	m.GET("/", rt.accountUserMiddleware("auth", "1"), func(c *gin.Context) {
		user, _ := c.Value("2").(persistence.LoginResult)
		c.String(http.StatusOK, fmt.Sprintf("user id is %v", user.UserID))
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
		if w.Code != http.StatusNotFound {
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
