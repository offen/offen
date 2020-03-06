// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"errors"
	"testing"
)

type mockMigrateDatabase struct {
	DataAccessLayer
	err error
}

func (m *mockMigrateDatabase) ApplyMigrations() error {
	return m.err
}

func TestPersistenceLayer_Migrate(t *testing.T) {
	t.Run("error", func(t *testing.T) {
		r := &persistenceLayer{dal: &mockMigrateDatabase{err: errors.New("did not work")}}
		if err := r.Migrate(); err == nil {
			t.Error("Expected error, got nil")
		}
	})
}
