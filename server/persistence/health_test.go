package persistence

import (
	"errors"
	"testing"
)

type mockPingDatabase struct {
	DataAccessLayer
	err error
}

func (m *mockPingDatabase) Ping() error {
	return m.err
}

func TestRelationalDatabase_CheckHealth(t *testing.T) {
	t.Run("error", func(t *testing.T) {
		r := &relationalDatabase{db: &mockPingDatabase{err: errors.New("did not work")}}
		if err := r.CheckHealth(); err == nil {
			t.Error("Expected error, got nil")
		}
	})
}
