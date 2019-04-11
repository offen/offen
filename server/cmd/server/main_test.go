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

func TestStatus(t *testing.T) {
	res, err := http.Get("http://localhost:8080/status")
	if err != nil {
		t.Fatalf("Unexpected error %v", err)
	}
	if res.StatusCode != http.StatusOK {
		t.Errorf("Unexpected status code %d", res.StatusCode)
	}
}

func TestEvents_Get(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		res, err := http.Get("http://localhost:8080/events")
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
		body := strings.NewReader(`{"account_id":"d03eb742-20d4-49b4-aa4e-d2e76e72b088","payload":"c2b2e7d2bf3d5539794a3fd9cff4d4cc"}`)
		req, err := http.NewRequest(http.MethodPost, "http://localhost:8080/events", body)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		req.AddCookie(&http.Cookie{Name: "user", Value: "3c6ccb0c-ff58-40dd-a588-9ba5b927e89a"})

		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		if res.StatusCode != http.StatusOK {
			t.Errorf("Unexpected status code %d", res.StatusCode)
		}
	})

	t.Run("missing `user` cookie", func(t *testing.T) {
		body := strings.NewReader(`{"account_id":"d03eb742-20d4-49b4-aa4e-d2e76e72b088","payload":"c2b2e7d2bf3d5539794a3fd9cff4d4cc"}`)
		req, err := http.NewRequest(http.MethodPost, "http://localhost:8080/events", body)
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

	t.Run("malformed body", func(t *testing.T) {
		body := strings.NewReader(`plain text payload`)
		req, err := http.NewRequest(http.MethodPost, "http://localhost:8080/events", body)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		req.AddCookie(&http.Cookie{Name: "user", Value: "3c6ccb0c-ff58-40dd-a588-9ba5b927e89a"})

		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("Unexpected status code %d", res.StatusCode)
		}
	})
}
