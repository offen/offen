package router

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/persistence"
)

func TestOptoutMiddleware(t *testing.T) {
	wrapped := optoutMiddleware("optout")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("hey there"))
	}))
	t.Run("with header", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		r.AddCookie(&http.Cookie{
			Name: "optout",
		})
		wrapped.ServeHTTP(w, r)

		if w.Code != http.StatusNoContent {
			t.Errorf("Unexpected status code %d", w.Code)
		}

		if w.Body.String() != "" {
			t.Errorf("Unexpected response body %s", w.Body.String())
		}
	})
	t.Run("without header", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		wrapped.ServeHTTP(w, r)

		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %d", w.Code)
		}

		if w.Body.String() != "hey there" {
			t.Errorf("Unexpected response body %s", w.Body.String())
		}
	})
}

func TestUserCookieMiddleware(t *testing.T) {
	wrapped := userCookieMiddleware("user", 1)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		value := r.Context().Value(1)
		fmt.Fprintf(w, "value is %v", value)
	}))
	t.Run("no cookie", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		wrapped.ServeHTTP(w, r)
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
		wrapped.ServeHTTP(w, r)
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
		wrapped.ServeHTTP(w, r)
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
	wrapped := rt.accountUserMiddleware("auth", 1)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, _ := r.Context().Value(2).(persistence.LoginResult)
		fmt.Fprintf(w, "user id is %v", user.UserID)
	}))

	t.Run("no cookie", func(t *testing.T) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		wrapped.ServeHTTP(w, r)
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
		wrapped.ServeHTTP(w, r)
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
		wrapped.ServeHTTP(w, r)
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
		wrapped.ServeHTTP(w, r)
		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})
}
