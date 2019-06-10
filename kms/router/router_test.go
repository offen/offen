package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/offen/offen/kms/keymanager"
	"github.com/sirupsen/logrus"
)

type mockKeyManager struct {
	keymanager.Manager
}

func TestNew(t *testing.T) {
	logger := logrus.New()
	manager := mockKeyManager{}
	rt := New("*", manager, logger)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/not/found", nil)

	rt.ServeHTTP(w, r)

	if w.Code != http.StatusNotFound {
		t.Errorf("Unexpected status code %v", w.Code)
	}
}
