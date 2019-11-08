package persistence

import (
	"errors"
	"testing"
	"time"
)

type mockExpireDatabase struct {
	DataAccessLayer
	err      error
	affected int64
}

func (m *mockExpireDatabase) DeleteEvents(q interface{}) (int64, error) {
	switch q.(type) {
	case DeleteEventsQueryOlderThan:
		return m.affected, m.err
	default:
		return 0, ErrBadQuery
	}
}

func TestRelationalDatabase_Expire(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		r := &relationalDatabase{
			db: &mockExpireDatabase{
				err:      nil,
				affected: 9876,
			},
		}
		affected, err := r.Expire(time.Second)
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if affected != 9876 {
			t.Errorf("Expected %d, got %d", 9876, affected)
		}
	})
	t.Run("error", func(t *testing.T) {
		r := &relationalDatabase{
			db: &mockExpireDatabase{
				err: errors.New("did not work"),
			},
		}
		affected, err := r.Expire(time.Second)
		if err == nil || err.Error() != "persistence: error expiring events: did not work" {
			t.Errorf("Unexpected error %v", err)
		}
		if affected != 0 {
			t.Errorf("Expected %d, got %d", 0, affected)
		}
	})
}
