package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/offen/offen/server/persistence"
)

type mockPersistence struct {
	persistence.Database
}

func TestRouter_Status(t *testing.T) {
	rt := router{&mockPersistence{}}
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	rt.status(w, r)

	if w.Code != http.StatusOK {
		t.Errorf("Unexpected status code %d", w.Code)
	}
}
