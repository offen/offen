package persistence

import (
	"errors"
	"fmt"
	"reflect"
	"testing"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

var publicKey = `
{
  "alg": "RSA-OAEP-256",
  "e": "AQAB",
  "ext": true,
  "key_ops": [
    "encrypt"
  ],
  "kty": "RSA",
  "n": "rJGC_lJ8tpAq8xaPFnvbkZDNUQxQ47_1gJ1A_TIM03uK2KuI1m-4DQsBmT8RfcRhI-ecvY5D4cqXmwKZxBXii7QjQeoFg3TApT4E4l1ZF4EBO_D9-1nlwM4C17Ip9Cardu09kp1vv2FVML0zFGCrS8Dvo4oQBtoieA_MmSyKRpJPN0we4gYxftjqpVym1cCsIeR7riBS_FvMsXph-R7OLKEiL_y4WUoi4wWal5Z3MsSYRRj4hwm-nllAwu2_dOtHSh8L8PlhqShDSNrn31feicpeMr08NVTMaJZjoLIXR_CT3V_E_E2JkKsrj8lWmp34ww7iMSWRE8woSXjv75Ieow"
}
`

func createTestDatabase() (*gorm.DB, func() error) {
	db, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		panic(err)
	}
	if err := db.AutoMigrate(&Event{}, &Account{}, &User{}).Error; err != nil {
		panic(err)
	}
	return db, db.Close
}

type mockEncrypter struct {
	result []byte
	err    error
}

func (m *mockEncrypter) Encrypt([]byte) ([]byte, error) {
	return m.result, m.err
}

func TestRelationalDatabase_GetAccount(t *testing.T) {
	tests := []struct {
		name          string
		setup         func(*gorm.DB) error
		includeEvents bool
		eventsSince   string
		assertion     func(AccountResult) error
		expectError   bool
	}{
		{
			"unknown account",
			func(*gorm.DB) error {
				return nil
			},
			false,
			"",
			func(r AccountResult) error {
				if !reflect.DeepEqual(r, AccountResult{}) {
					return fmt.Errorf("unexpected result %#v", r)
				}
				return nil
			},
			true,
		},
		{
			"without events",
			func(db *gorm.DB) error {
				return db.Create(&Account{
					AccountID:           "account-id",
					PublicKey:           publicKey,
					EncryptedPrivateKey: "encrypted-secret-key",
					UserSalt:            "user-salt",
				}).Error
			},
			false,
			"",
			func(r AccountResult) error {
				if r.AccountID != "account-id" {
					return fmt.Errorf("unexpected account id %v", r.AccountID)
				}
				if r.EncryptedPrivateKey != "" {
					return fmt.Errorf("expected empty secret key, got %v", r.EncryptedPrivateKey)
				}
				if r.Events != nil {
					return fmt.Errorf("expected nil events, got %v", r.Events)
				}
				if r.UserSecrets != nil {
					return fmt.Errorf("expected nil user secrets, got %v", r.UserSecrets)
				}
				return nil
			},
			false,
		},
		{
			"including events",
			func(db *gorm.DB) error {
				if err := db.Create(&Account{
					AccountID:           "account-id",
					PublicKey:           publicKey,
					EncryptedPrivateKey: "encrypted-secret-key",
					UserSalt:            "user-salt",
				}).Error; err != nil {
					return err
				}
				userID := "hashed-user-id"
				if err := db.Create(&User{
					HashedUserID:        userID,
					EncryptedUserSecret: "encrypted-user-secret",
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					AccountID:    "account-id",
					HashedUserID: &userID,
					Payload:      "payload",
					EventID:      "event-id-1",
				}).Error; err != nil {
					return err
				}
				return db.Create(&Event{
					AccountID:    "account-id",
					HashedUserID: &userID,
					Payload:      "other-payload",
					EventID:      "event-id-0",
				}).Error
			},
			true,
			"event-id-0",
			func(r AccountResult) error {
				if r.AccountID != "account-id" {
					return fmt.Errorf("unexpected account id %v", r.AccountID)
				}
				if r.EncryptedPrivateKey != "encrypted-secret-key" {
					return fmt.Errorf("unexpected secret key %v", r.EncryptedPrivateKey)
				}
				userID := "hashed-user-id"
				if !reflect.DeepEqual(r.Events, &EventsByAccountID{
					"account-id": []EventResult{
						{
							AccountID: "account-id",
							UserID:    &userID,
							Payload:   "payload",
							EventID:   "event-id-1",
						},
					},
				}) {
					return fmt.Errorf("unexpected events %v", r.Events)
				}
				if !reflect.DeepEqual(r.UserSecrets, &SecretsByUserID{
					"hashed-user-id": "encrypted-user-secret",
				}) {
					return fmt.Errorf("unexpected user secrets %v", r.UserSecrets)
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
				t.Fatalf("Unexpected error setting up test %v", err)
			}
			relational := &relationalDatabase{
				db: NewRelationalDAL(db),
			}
			result, err := relational.GetAccount("account-id", test.includeEvents, test.eventsSince)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
			if err := test.assertion(result); err != nil {
				t.Errorf("Unexpected assertion error: %v", err)
			}
		})
	}
}

func TestRelationalDatabase_AssociateUserSecret(t *testing.T) {
	a1 := Account{
		AccountID: "account-id",
		UserSalt:  "user-salt",
	}
	tests := []struct {
		name        string
		setup       func(*gorm.DB) error
		assertion   func(*gorm.DB) error
		expectError bool
	}{
		{
			"empty database",
			func(db *gorm.DB) error {
				return nil
			},
			func(db *gorm.DB) error {
				return nil
			},
			true,
		},
		{
			"new user",
			func(db *gorm.DB) error {
				return db.Create(&a1).Error
			},
			func(db *gorm.DB) error {
				var user User
				if err := db.Where("hashed_user_id = ?", a1.HashUserID("user-id")).Find(&user).Error; err != nil {
					return err
				}
				if user.EncryptedUserSecret != "encrypted-user-secret" {
					return fmt.Errorf("Unexpected value for user secret %v", user.EncryptedUserSecret)
				}
				return nil
			},
			false,
		},
		{
			"migrating existing user",
			func(db *gorm.DB) error {
				if err := db.Create(&a1).Error; err != nil {
					return err
				}
				if err := db.Create(&User{
					HashedUserID:        a1.HashUserID("user-id"),
					EncryptedUserSecret: "previous-user-secret",
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Event{
					EventID:      "event-id",
					AccountID:    "account-id",
					Payload:      "payload",
					HashedUserID: str(a1.HashUserID("user-id")),
				}).Error; err != nil {
					return err
				}
				return nil
			},
			func(db *gorm.DB) error {
				var user User
				if err := db.Where("hashed_user_id = ?", a1.HashUserID("user-id")).Find(&user).Error; err != nil {
					return err
				}
				if user.EncryptedUserSecret != "encrypted-user-secret" {
					return fmt.Errorf("Unexpected value for user secret %v", user.EncryptedUserSecret)
				}

				var previous User
				if err := db.Where("encrypted_user_secret = ?", "previous-user-secret").Find(&previous).Error; err != nil {
					return err
				}
				if previous.HashedUserID == a1.HashUserID("user-id") {
					return errors.New("user not migrated to a new user identifier")
				}

				var event Event
				if err := db.Table("events").First(&event).Error; err != nil {
					return err
				}
				if event.EventID == "event-id" {
					return errors.New("events not migrated to a new id")
				}
				if *event.HashedUserID != previous.HashedUserID {
					return fmt.Errorf("unexpected user identifier on event %v", *event.HashedUserID)
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
				t.Fatalf("Error setting up test: %v", err)
			}
			relational := relationalDatabase{db: NewRelationalDAL(db)}

			err := relational.AssociateUserSecret("account-id", "user-id", "encrypted-user-secret")
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
			if err := test.assertion(db); err != nil {
				t.Errorf("Unexpected assertion error: %v", err)
			}
		})
	}
}
