package relational

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func TestRelationalDAL_CreateSecret(t *testing.T) {
	tests := []struct {
		name      string
		setup     dbAccess
		secret    *persistence.Secret
		assertion dbAccess
	}{
		{
			"ok",
			noop,
			&persistence.Secret{
				SecretID:        "hashed-id-1",
				EncryptedSecret: "encrypted-secret",
			},
			func(db *gorm.DB) error {
				var secret Secret
				if err := db.Where("secret_id = ?", "hashed-id-1").First(&secret).Error; err != nil {
					return fmt.Errorf("error looking up record: %w", err)
				}
				if secret.EncryptedSecret != "encrypted-secret" {
					return fmt.Errorf("unexpected user secret %v", secret.EncryptedSecret)
				}
				return nil
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, dbClose := createTestDatabase()
			defer dbClose()
			dal := NewRelationalDAL(db)

			if err := test.setup(db); err != nil {
				t.Fatalf("Unexpected error running setup: %v", err)
			}
			if err := dal.CreateSecret(test.secret); err != nil {
				t.Errorf("Unexpected error creating secret: %v", err)
			}
			if err := test.assertion(db); err != nil {
				t.Errorf("Encountered assertion error: %v", err)
			}
		})
	}
}

func TestRelationalDAL_DeleteSecret(t *testing.T) {
	tests := []struct {
		name        string
		setup       dbAccess
		arg         interface{}
		expectError bool
		assertion   dbAccess
	}{
		{
			"bad arg",
			noop,
			12,
			true,
			noop,
		},
		{
			"inexistent secret",
			noop,
			persistence.DeleteSecretQueryBySecretID("hashed-user-id-1"),
			false,
			noop,
		},
		{
			"existent secret",
			func(db *gorm.DB) error {
				if err := db.Save(&Secret{
					SecretID: "hashed-user-id-1",
				}).Error; err != nil {
					return fmt.Errorf("error inserting secret: %w", err)
				}
				if err := db.Save(&Secret{
					SecretID: "hashed-user-id-2",
				}).Error; err != nil {
					return fmt.Errorf("error inserting secret: %w", err)
				}
				return nil
			},
			persistence.DeleteSecretQueryBySecretID("hashed-user-id-1"),
			false,
			func(db *gorm.DB) error {
				err := db.Where("secret_id = ?", "hashed-user-id-1").Error
				if !gorm.IsRecordNotFoundError(err) {
					return err
				}
				if err := db.Where("secret_id = ?", "hashed-user-id-2").Error; err != nil {
					return fmt.Errorf("error looking up unaffected secret: %v", err)
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

			err := dal.DeleteSecret(test.arg)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Unexpected assertion error: %v", err)
			}
		})
	}
}

func TestRelationalDAL_FindSecret(t *testing.T) {
	tests := []struct {
		name           string
		setup          dbAccess
		arg            interface{}
		expectedResult persistence.Secret
		expectError    bool
	}{
		{
			"bad query",
			noop,
			34,
			persistence.Secret{},
			true,
		},
		{
			"secret not found",
			func(db *gorm.DB) error {
				return db.Save(&Secret{
					SecretID: "hashed-user-id-1",
				}).Error
			},
			persistence.FindSecretQueryBySecretID("hashed-user-id-9"),
			persistence.Secret{},
			true,
		},
		{
			"secret found",
			func(db *gorm.DB) error {
				return db.Save(&Secret{
					SecretID:        "hashed-user-id-1",
					EncryptedSecret: "encrypted-user-secret-1",
				}).Error
			},
			persistence.FindSecretQueryBySecretID("hashed-user-id-1"),
			persistence.Secret{
				SecretID:        "hashed-user-id-1",
				EncryptedSecret: "encrypted-user-secret-1",
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

			result, err := dal.FindSecret(test.arg)

			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}
