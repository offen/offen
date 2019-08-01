package keys

import (
	"testing"
	"time"
)

func TestAuthentication(t *testing.T) {
	t.Run("empty secret", func(t *testing.T) {
		_, err := NewAuthentication(nil, time.Second)
		if err == nil {
			t.Error("Expected error, got nil")
		}
	})

	t.Run("expired", func(t *testing.T) {
		a, err := NewAuthentication([]byte("ABC123"), time.Millisecond)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		time.Sleep(2 * time.Millisecond)
		if err := a.Validate([]byte("ABC123")); err == nil {
			t.Error("Expected error, got nil")
		}
	})

	t.Run("ok", func(t *testing.T) {
		a, err := NewAuthentication([]byte("ABC123"), time.Second)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		time.Sleep(2 * time.Millisecond)
		if err := a.Validate([]byte("ABC123")); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
	})

	t.Run("forged", func(t *testing.T) {
		a := Authentication{
			Expires:   time.Now().Add(time.Hour).Unix(),
			Token:     "asdu32nzz_7",
			Signature: "c29tZXRoaW5nLXNvbWV0aGluZw==",
		}
		time.Sleep(2 * time.Millisecond)
		if err := a.Validate([]byte("ABC123")); err == nil {
			t.Error("Expected error, got nil")
		}
	})
}
