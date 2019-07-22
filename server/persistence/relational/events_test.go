package relational

import (
	"errors"
	"fmt"
	"reflect"
	"testing"

	"github.com/jinzhu/gorm"
)

func TestRelationalDatabase_Insert(t *testing.T) {
	tests := []struct {
		name        string
		userID      string
		setup       func(*gorm.DB) error
		assertion   func(*gorm.DB) error
		expectError bool
	}{
		{
			"unknown account",
			"user-id",
			func(*gorm.DB) error {
				return nil
			},
			func(*gorm.DB) error {
				return nil
			},
			true,
		},
		{
			"unknown user",
			"user-id",
			func(db *gorm.DB) error {
				return db.Create(&Account{
					AccountID: "account-id",
					UserSalt:  "user-salt",
				}).Error
			},
			func(*gorm.DB) error {
				return nil
			},
			true,
		},
		{
			"ok",
			"user-id",
			func(db *gorm.DB) error {
				a := Account{
					AccountID: "account-id",
					UserSalt:  "user-salt",
				}
				if err := db.Create(&a).Error; err != nil {
					return err
				}
				return db.Create(&User{
					HashedUserID:        a.HashUserID("user-id"),
					EncryptedUserSecret: "encrypted-user-secret",
				}).Error
			},
			func(db *gorm.DB) error {
				count := 0
				db.Table("events").Count(&count)
				if count != 1 {
					return fmt.Errorf("events table contained %d rows", count)
				}
				event := Event{}
				db.Table("events").First(&event)
				if event.AccountID != "account-id" {
					return fmt.Errorf("event has account id %v", event.AccountID)
				}
				if event.HashedUserID == nil {
					return errors.New("event had nil user id")
				}
				if *event.HashedUserID == "user-id" {
					return errors.New("event contains unhashed user identifier")
				}
				if event.Payload != "payload" {
					return fmt.Errorf("event had payload %v", event.Payload)
				}
				return nil
			},
			false,
		},
		{
			"anonymous event",
			"",
			func(db *gorm.DB) error {
				return db.Create(&Account{
					AccountID: "account-id",
					UserSalt:  "user-salt",
				}).Error
			},
			func(db *gorm.DB) error {
				count := 0
				db.Table("events").Count(&count)
				if count != 1 {
					return fmt.Errorf("events table contained %d rows", count)
				}
				event := Event{}
				db.Table("events").First(&event)
				if event.AccountID != "account-id" {
					return fmt.Errorf("event has account id %v", event.AccountID)
				}
				if event.HashedUserID != nil {
					return errors.New("event did not have nil user id")
				}
				if event.Payload != "payload" {
					return fmt.Errorf("event had payload %v", event.Payload)
				}
				return nil
			},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()
			if err := test.setup(db); err != nil {
				t.Fatalf("Unexpected error setting up test: %v", err)
			}
			relational := &relationalDatabase{db: db}
			err := relational.Insert(test.userID, "account-id", "payload")
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
			if err := test.assertion(db); err != nil {
				t.Errorf("Unexpected assertion error: %v", err)
			}
		})
	}
}

func str(s string) *string {
	return &s
}
func TestRelationalDatabase_Purge(t *testing.T) {
	tests := []struct {
		name        string
		setup       func(*gorm.DB) error
		assertion   func(*gorm.DB) error
		expectError bool
	}{
		{
			"nothing to purge",
			func(*gorm.DB) error {
				return nil
			},
			func(*gorm.DB) error {
				return nil
			},
			false,
		},
		{
			"ok",
			func(db *gorm.DB) error {
				a := Account{
					AccountID: "account-id",
					UserSalt:  "user-salt",
				}
				a2 := Account{
					AccountID: "account-id-2",
					UserSalt:  "user-salt-2",
				}
				if err := db.Create(&a).Error; err != nil {
					return err
				}
				if err := db.Create(&a2).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID:      "event-id-1",
					HashedUserID: str(a.HashUserID("user-id")),
					Payload:      "payload",
					AccountID:    "account-1",
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID:      "event-id-2",
					HashedUserID: str(a.HashUserID("other-user")),
					Payload:      "payload",
					AccountID:    "account-1",
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID:      "event-id-3",
					HashedUserID: str(a2.HashUserID("user-id")),
					Payload:      "payload",
					AccountID:    "account-2",
				}).Error; err != nil {
					return err
				}
				return nil
			},
			func(db *gorm.DB) error {
				count := 0
				db.Table("events").Count(&count)
				if count != 1 {
					return fmt.Errorf("unexpected row count %v", count)
				}
				if err := db.First(&Event{EventID: "event-id-2"}).Error; err != nil {
					return err
				}
				return nil
			},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()

			relational := relationalDatabase{db: db}

			if err := test.setup(db); err != nil {
				t.Fatalf("Error setting up database %v", err)
			}

			err := relational.Purge("user-id")
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Assertion error: %v", err)
			}
		})
	}
}

func TestRelationalDatabase_GetDeletedEvents(t *testing.T) {
	tests := []struct {
		name        string
		setup       func(*gorm.DB) error
		userIDArg   string
		expectedIDs []string
		expectError bool
	}{
		{
			"account level",
			func(db *gorm.DB) error {
				if err := db.Create(&Account{
					AccountID: "account-id",
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID: "a",
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID: "c",
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID: "e",
				}).Error; err != nil {
					return err
				}
				return nil
			},
			"",
			[]string{"b", "d"},
			false,
		},
		{
			"user level",
			func(db *gorm.DB) error {
				a := Account{
					AccountID: "account-id",
					UserSalt:  "user-salt",
				}
				if err := db.Create(&a).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID:      "a",
					HashedUserID: str(a.HashUserID("user-id")),
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID:      "b",
					HashedUserID: str(a.HashUserID("other-user")),
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID:      "c",
					HashedUserID: str(a.HashUserID("user-id")),
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID:      "e",
					HashedUserID: str(a.HashUserID("user-id")),
				}).Error; err != nil {
					return err
				}
				return nil
			},
			"user-id",
			[]string{"d", "b"},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()

			relational := relationalDatabase{db: db}
			if err := test.setup(db); err != nil {
				t.Fatalf("Error setting up test: %v", err)
			}
			result, err := relational.GetDeletedEvents([]string{"a", "b", "c", "d"}, test.userIDArg)

			if !reflect.DeepEqual(test.expectedIDs, result) {
				t.Errorf("Expected %v, got %v", test.expectedIDs, result)
			}

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}
