package relational

import (
	"errors"
	"fmt"
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
