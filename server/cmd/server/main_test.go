package main

import (
	"net/http"
	"os"
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
