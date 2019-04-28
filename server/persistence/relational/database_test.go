//+build integration

package relational

import (
	"os"
	"testing"
)

func TestNew(t *testing.T) {
	t.Run("default", func(t *testing.T) {
		_, err := New()
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
	})
	t.Run("config", func(t *testing.T) {
		_, err := New(WithConnectionString(os.Getenv("POSTGRES_CONNECTION_STRING")))
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
	})
	t.Run("bad config", func(t *testing.T) {
		_, err := New(WithConnectionString("something that is not a database"), WithDialect("texan"))
		if err == nil {
			t.Error("Expected error, got nil")
		}
	})
}
