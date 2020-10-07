// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0
package relational

import (
	"fmt"
	"reflect"
	"testing"

	"gorm.io/gorm"
	"github.com/offen/offen/server/persistence"
)

func TestRelationalDAL_CreateTombstone(t *testing.T) {
	tests := []struct {
		name        string
		input       persistence.Tombstone
		expectError bool
		assertion   dbAccess
	}{
		{
			"ok",
			persistence.Tombstone{
				EventID:   "event-id",
				AccountID: "account-id",
				SecretID:  nil,
				Sequence:  "sequence-a",
			},
			false,
			func(db *gorm.DB) error {
				var allRecords []Tombstone
				if err := db.Find(&allRecords).Error; err != nil {
					return err
				}
				if len(allRecords) != 1 {
					return fmt.Errorf("expected 1 item, got %d", len(allRecords))
				}
				if !reflect.DeepEqual(allRecords[0], Tombstone{
					EventID:   "event-id",
					AccountID: "account-id",
					SecretID:  nil,
					Sequence:  "sequence-a",
				}) {
					return fmt.Errorf("found unexpected record %v", allRecords[0])
				}
				return nil
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()
			dal := NewRelationalDAL(db)

			err := dal.CreateTombstone(&test.input)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Unexpected assertion error %v", err)
			}
		})
	}
}

func TestRelationalDAL_FindTombstones(t *testing.T) {
	tests := []struct {
		name        string
		setup       dbAccess
		query       interface{}
		expectError bool
		result      []persistence.Tombstone
	}{
		{
			"bad query",
			func(*gorm.DB) error { return nil },
			"something something",
			true,
			nil,
		},
		{
			"query by account id",
			func(db *gorm.DB) error {
				if err := db.Save(&Tombstone{
					EventID:   "event-a",
					AccountID: "account-a",
					SecretID:  strptr("secret-a"),
					Sequence:  "sequence-a",
				}).Error; err != nil {
					return err
				}
				if err := db.Save(&Tombstone{
					EventID:   "event-b",
					AccountID: "account-b",
					SecretID:  strptr("secret-a"),
					Sequence:  "sequence-b",
				}).Error; err != nil {
					return err
				}
				if err := db.Save(&Tombstone{
					EventID:   "event-c",
					AccountID: "account-a",
					SecretID:  strptr("secret-a"),
					Sequence:  "sequence-b",
				}).Error; err != nil {
					return err
				}
				return nil
			},
			persistence.FindTombstonesQueryByAccounts{
				Since:      "sequence-a",
				AccountIDs: []string{"account-a", "account-z"},
			},
			false,
			[]persistence.Tombstone{
				{
					EventID:   "event-c",
					AccountID: "account-a",
					SecretID:  strptr("secret-a"),
					Sequence:  "sequence-b",
				},
			},
		},
		{
			"query by secret id",
			func(db *gorm.DB) error {
				if err := db.Save(&Tombstone{
					EventID:   "event-a",
					AccountID: "account-a",
					SecretID:  strptr("secret-a"),
					Sequence:  "sequence-a",
				}).Error; err != nil {
					return err
				}
				if err := db.Save(&Tombstone{
					EventID:   "event-b",
					AccountID: "account-b",
					SecretID:  strptr("secret-b"),
					Sequence:  "sequence-b",
				}).Error; err != nil {
					return err
				}
				if err := db.Save(&Tombstone{
					EventID:   "event-c",
					AccountID: "account-a",
					SecretID:  strptr("secret-a"),
					Sequence:  "sequence-b",
				}).Error; err != nil {
					return err
				}
				return nil
			},
			persistence.FindTombstonesQueryBySecrets{
				Since:     "sequence-a",
				SecretIDs: []string{"secret-a", "secret-z"},
			},
			false,
			[]persistence.Tombstone{
				{
					EventID:   "event-c",
					AccountID: "account-a",
					SecretID:  strptr("secret-a"),
					Sequence:  "sequence-b",
				},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()

			if err := test.setup(db); err != nil {
				t.Fatalf("Unexpected error running setup %v", err)
			}
			dal := NewRelationalDAL(db)

			result, err := dal.FindTombstones(test.query)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if !reflect.DeepEqual(result, test.result) {
				t.Errorf("Unexpected query result %v", result)
			}
		})
	}
}
