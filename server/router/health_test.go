package router

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/offen/offen/server/persistence"
)

type mockHealthChecker struct {
	persistence.Database
	err error
}

func (m *mockHealthChecker) CheckHealth() error {
	return m.err
}

func TestRouter_getHealth(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		rt := router{
			db: &mockHealthChecker{},
		}
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		rt.getHealth(w, r)
		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})
	t.Run("ping error", func(t *testing.T) {
		rt := router{
			db: &mockHealthChecker{
				err: errors.New("did not work"),
			},
		}
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		rt.getHealth(w, r)
		if w.Code != http.StatusBadGateway {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})
}
