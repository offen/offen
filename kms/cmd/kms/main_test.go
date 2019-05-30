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

func TestEvents_Get(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodGet, "http://localhost:8080?encrypted_key=abc123", nil)
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

func TestEvents_Post(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		body := strings.NewReader(`{"encrypted_key":"78403940-ae4f-4aff-a395-1e90f145cf62"}`)
		req, err := http.NewRequest(http.MethodPost, "http://localhost:8080", body)
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
		req, err := http.NewRequest(http.MethodPost, "http://localhost:8080", body)
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
