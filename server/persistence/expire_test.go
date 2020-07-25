// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

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
	return m.affected, m.err
}

func (m *mockExpireDatabase) FindTombstones(q interface{}) ([]Tombstone, error) {
	return nil, m.err
}

func (m *mockExpireDatabase) FindEvents(q interface{}) ([]Event, error) {
	return nil, m.err
}

func (m *mockExpireDatabase) Commit() error {
	return nil
}

func (m *mockExpireDatabase) Rollback() error {
	return nil
}

func (m *mockExpireDatabase) Transaction() (Transaction, error) {
	return m, nil
}

func TestPersistenceLayer_Expire(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		r := &persistenceLayer{
			dal: &mockExpireDatabase{
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
		r := &persistenceLayer{
			dal: &mockExpireDatabase{
				err: errors.New("did not work"),
			},
		}
		affected, err := r.Expire(time.Second)
		if err == nil {
			t.Errorf("Unexpected error value %v", err)
		}
		if affected != 0 {
			t.Errorf("Expected %d, got %d", 0, affected)
		}
	})
}
