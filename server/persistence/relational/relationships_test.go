package relational

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func TestRelationalDAL_CreateAccountUserRelationship(t *testing.T) {
	tests := []struct {
		name        string
		arg         *persistence.AccountUserRelationship
		expectError bool
		assertion   dbAccess
	}{
		{
			"ok",
			&persistence.AccountUserRelationship{
				RelationshipID: "some-id",
			},
			false,
			func(db *gorm.DB) error {
				err := db.Where("relationship_id = ?", "some-id").First(&AccountUserRelationship{}).Error
				if err != nil {
					return fmt.Errorf("error looking up relationship record: %w", err)
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

			err := dal.CreateAccountUserRelationship(test.arg)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Assertion error when validating database state: %v", err)
			}
		})
	}
}

func TestRelationalDAL_FindAccountUserRelationships(t *testing.T) {
	tests := []struct {
		name           string
		setup          dbAccess
		query          interface{}
		expectedResult []persistence.AccountUserRelationship
		expectError    bool
	}{
		{
			"bad query",
			noop,
			99,
			nil,
			true,
		},
		{
			"ok",
			func(db *gorm.DB) error {
				for _, id := range []string{"relationship-a", "relationship-b", "relationship-c"} {
					if err := db.Save(&AccountUserRelationship{
						RelationshipID: id,
						AccountUserID:  "user-a",
					}).Error; err != nil {
						return fmt.Errorf("error saving fixtures: %w", err)
					}
				}
				if err := db.Save(&AccountUserRelationship{
					RelationshipID: "relationship-z",
					AccountUserID:  "user-b",
				}).Error; err != nil {
					return fmt.Errorf("error saving fixtures: %w", err)
				}
				return nil
			},
			persistence.FindAccountUserRelationShipsQueryByUserID("user-a"),
			[]persistence.AccountUserRelationship{
				{RelationshipID: "relationship-a", AccountUserID: "user-a"},
				{RelationshipID: "relationship-b", AccountUserID: "user-a"},
				{RelationshipID: "relationship-c", AccountUserID: "user-a"},
			},
			false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()

			dal := NewRelationalDAL(db)

			if err := test.setup(db); err != nil {
				t.Fatalf("Unexpected error setting up test: %v", err)
			}

			result, err := dal.FindAccountUserRelationships(test.query)
			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}

func TestRelationalDAL_UpdateAccountUserRelationship(t *testing.T) {
	tests := []struct {
		name        string
		setup       dbAccess
		arg         *persistence.AccountUserRelationship
		expectError bool
		assertion   dbAccess
	}{
		{
			"unknown record",
			noop,
			&persistence.AccountUserRelationship{
				RelationshipID: "some-id",
			},
			true,
			func(db *gorm.DB) error {
				var count int
				db.Find(&AccountUserRelationship{}).Count(&count)
				if count != 0 {
					return fmt.Errorf("unexpected row count %d", count)
				}
				return nil
			},
		},
		{
			"ok",
			func(db *gorm.DB) error {
				return db.Save(&AccountUserRelationship{
					RelationshipID:                    "some-id",
					PasswordEncryptedKeyEncryptionKey: "xxx-secret",
				}).Error
			},
			&persistence.AccountUserRelationship{
				RelationshipID:                    "some-id",
				PasswordEncryptedKeyEncryptionKey: "yyy-secret",
			},
			false,
			func(db *gorm.DB) error {
				var r AccountUserRelationship
				if err := db.Where("relationship_id = ?", "some-id").First(&r).Error; err != nil {
					return fmt.Errorf("error looking up relationship: %w", err)
				}
				if r.PasswordEncryptedKeyEncryptionKey != "yyy-secret" {
					return fmt.Errorf("expected record to be updated, received %v", r)
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

			if err := test.setup(db); err != nil {
				t.Fatalf("Unexpected error setting up test: %v", err)
			}

			err := dal.UpdateAccountUserRelationship(test.arg)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Assertion error when validating database content: %v", err)
			}
		})
	}
}
