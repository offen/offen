//+build integration

package main

import (
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	go main()
	time.Sleep(time.Millisecond * 50)
	os.Exit(m.Run())
}

func TestKMS_Decrypt(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		body := strings.NewReader(`{"encrypted_private_key":"somevalue"}`)
		req, err := http.NewRequest(http.MethodPost, "http://localhost:8080/decrypt", body)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		if res.StatusCode != http.StatusOK {
			t.Errorf("Unexpected status code %d", res.StatusCode)
		}
	})
}

func TestKMS_Encrypt(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		body := strings.NewReader(`{"decrypted_private_key":"someothervalue"}`)
		req, err := http.NewRequest(http.MethodPost, "http://localhost:8080/encrypt", body)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		if res.StatusCode != http.StatusOK {
			t.Errorf("Unexpected status code %d", res.StatusCode)
		}
	})

	t.Run("malformed body", func(t *testing.T) {
		body := strings.NewReader(`plain text payload`)
		req, err := http.NewRequest(http.MethodPost, "http://localhost:8080/encrypt", body)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("Unexpected status code %d", res.StatusCode)
		}
	})
}
