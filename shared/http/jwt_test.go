package http

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestJWTProtect(t *testing.T) {
	tests := []struct {
		name               string
		cookie             *http.Cookie
		keyURL             string
		expectedStatusCode int
	}{
		{
			"no cookie",
			nil,
			"http://localhost:9999",
			http.StatusForbidden,
		},
		{
			"bad url",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			"http://localhost:9999",
			http.StatusInternalServerError,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			wrappedHandler := JWTProtect("http://localhost:9999", "auth")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("OK"))
			}))
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			if test.cookie != nil {
				r.AddCookie(test.cookie)
			}
			wrappedHandler.ServeHTTP(w, r)
			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
		})
	}
}
