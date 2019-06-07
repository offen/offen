package router

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRouter_HandleStatus(t *testing.T) {
	rt := router{}
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	rt.handleStatus(w, r)

	if w.Code != http.StatusOK {
		t.Errorf("Unexpected status code %v", w.Code)
	}
}
