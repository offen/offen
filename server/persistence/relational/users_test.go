package relational

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func TestRelationalDAL_CreateUser(t *testing.T) {
	tests := []struct {
		name      string
		setup     dbaccess
		user      *persistence.User
		assertion dbaccess
	}{
		{
			"ok",
			noop,
			&persistence.User{
				HashedUserID:        "hashed-id-1",
				EncryptedUserSecret: "encrypted-secret",
			},
			func(db *gorm.DB) error {
				var user User
				if err := db.Where("hashed_user_id = ?", "hashed-id-1").First(&user).Error; err != nil {
					return fmt.Errorf("error looking up record: %w", err)
				}
				if user.EncryptedUserSecret != "encrypted-secret" {
					return fmt.Errorf("unexpected user secret %v", user.EncryptedUserSecret)
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
			if err := dal.CreateUser(test.user); err != nil {
				t.Errorf("Unexpected error creating user: %v", err)
			}
			if err := test.assertion(db); err != nil {
				t.Errorf("Encountered assertion error: %v", err)
			}
		})
	}
}

func TestRelationalDAL_DeleteUser(t *testing.T) {
	tests := []struct {
		name        string
		setup       dbaccess
		arg         interface{}
		expectError bool
		assertion   dbaccess
	}{
		{
			"bad arg",
			noop,
			12,
			true,
			noop,
		},
		{
			"inexistent user",
			noop,
			persistence.DeleteUserQueryByHashedID("hashed-user-id-1"),
			false,
			noop,
		},
		{
			"existent user",
			func(db *gorm.DB) error {
				if err := db.Save(&User{
					HashedUserID: "hashed-user-id-1",
				}).Error; err != nil {
					return fmt.Errorf("error inserting user: %w", err)
				}
				if err := db.Save(&User{
					HashedUserID: "hashed-user-id-2",
				}).Error; err != nil {
					return fmt.Errorf("error inserting user: %w", err)
				}
				return nil
			},
			persistence.DeleteUserQueryByHashedID("hashed-user-id-1"),
			false,
			func(db *gorm.DB) error {
				err := db.Where("hashed_user_id = ?", "hashed-user-id-1").Error
				if !gorm.IsRecordNotFoundError(err) {
					return err
				}
				if err := db.Where("hashed_user_id = ?", "hashed-user-id-2").Error; err != nil {
					return fmt.Errorf("error looking up unaffected user: %v", err)
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

			err := dal.DeleteUser(test.arg)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Unexpected assertion error: %v", err)
			}
		})
	}
}

func TestRelationalDAL_FindUser(t *testing.T) {
	tests := []struct {
		name           string
		setup          dbaccess
		arg            interface{}
		expectedResult persistence.User
		expectError    bool
	}{
		{
			"bad query",
			noop,
			34,
			persistence.User{},
			true,
		},
		{
			"user not found",
			func(db *gorm.DB) error {
				return db.Save(&User{
					HashedUserID: "hashed-user-id-1",
				}).Error
			},
			persistence.FindUserQueryByHashedUserID("hashed-user-id-9"),
			persistence.User{},
			true,
		},
		{
			"user found",
			func(db *gorm.DB) error {
				return db.Save(&User{
					HashedUserID:        "hashed-user-id-1",
					EncryptedUserSecret: "encrypted-user-secret-1",
				}).Error
			},
			persistence.FindUserQueryByHashedUserID("hashed-user-id-1"),
			persistence.User{
				HashedUserID:        "hashed-user-id-1",
				EncryptedUserSecret: "encrypted-user-secret-1",
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

			result, err := dal.FindUser(test.arg)

			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}
