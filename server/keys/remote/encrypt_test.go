package remote

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

func TestEncrypt(t *testing.T) {
	tests := []struct {
		name           string
		data           []byte
		server         *httptest.Server
		expectedResult []byte
		expectError    bool
	}{
		{
			"no server",
			[]byte("test"),
			httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("not yet"))
			})),
			nil,
			true,
		},
		{
			"bad response",
			[]byte("test"),
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("something something"))
			})),
			nil,
			true,
		},
		{
			"bad gateway",
			[]byte("test"),
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(`{"error":"did not work","status":500}`))
			})),
			nil,
			true,
		},
		{
			"ok",
			[]byte("test"),
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				b, _ := ioutil.ReadAll(r.Body)
				if !reflect.DeepEqual(b, []byte(`{"decrypted":"test"}`)) {
					http.Error(w, "expected different payload in test setup", http.StatusInternalServerError)
				}
				w.Write([]byte(`{"encrypted":"something"}`))
			})),
			[]byte("something"),
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			encryption := &kmsRemoteEncryption{test.server.URL}
			result, err := encryption.Encrypt(test.data)
			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Unexpected result %v", result)
			}
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}
