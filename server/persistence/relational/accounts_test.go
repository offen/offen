package relational

import (
	"errors"
	"fmt"
	"reflect"
	"testing"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/persistence"
)

var publicKey = `
-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEAv3dlQ+5f7GfcJkctx59+Cyoygf+snYdRmU6gdaZ5hoB+mCe4DeEa
3hl42S6HfMJI/qfotmL3J67eP4r+dCqtRvjzUUMSyBDqbtatSndIZ+M1meIn8676
2xrm5aSUYO5egyD9QwcxoUiNSgea3+5DWKlA8FeH8ViFFfiPM59n2BlbqB9vh5Ps
fQldsn2HQzW86UWnvBU3OKKRzVxFEJ3HLIc2C3XifcKGo7aZjthUVcrX2KrHK5Mp
Vcxh+HicKOGbkjOGlTO6ybEO259n4mPj3mlzgRjZznGY/5c/pNfKBoi/EvZTR5rH
FmlmSQ6HjqqRa0oEOFjGZqLPsZGtTV6kDVCNGE8iaBNn5cvzeGP8nu+FgVILIvpH
C0A6iarc5Q3BSOoJFVPfmSQoQrwiLlBRRiMGEl2YVjOJ1YH+uBXJlH8LkT1jFmQ/
kTEq5D2Ej6W/KW9wVJjGvLkphlmbqhECMsSzz79q2blKD8WwoxQO3xvH/vLLTBUN
62GDbF2Iozpbly+74Tu4uruLgXRukm30kfaAqPrnOSSNDI5EIMoqPh4n1L9S05vD
57CJIw83Lr67SuMgCzXnR0CgV/U+8iVO772BqsPilbOA3yRbaW9DOQJWTcDn+gwb
kkGaifOHQRQyqOSH4cUXORZt8DECJRt69kjg1F5SBfjGed4kVhIp4nUCAwEAAQ==
-----END RSA PUBLIC KEY-----
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

func TestRelationalDatabase_RetireAccount(t *testing.T) {
	tests := []struct {
		name        string
		setup       func(*gorm.DB) error
		assertion   func(*gorm.DB) error
		expectError bool
	}{
		{
			"unknown account",
			func(db *gorm.DB) error {
				return nil
			},
			func(db *gorm.DB) error {
				return nil
			},
			true,
		},
		{
			"ok",
			func(db *gorm.DB) error {
				return db.Create(&Account{AccountID: "account-id"}).Error
			},
			func(db *gorm.DB) error {
				var match Account
				db.First(&match, "account_id = ?", "account-id")
				if match.Retired != true {
					return errors.New("expected account to be retired")
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

			relational := relationalDatabase{db: db}

			err := relational.RetireAccount("account-id")
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Unexpected assertion error %v", err)
			}
		})
	}
}

func TestRelationalDatabase_CreateAccount(t *testing.T) {
	tests := []struct {
		name        string
		setup       func(*gorm.DB) error
		encryption  keys.Encrypter
		assertion   func(*gorm.DB) error
		expectError bool
	}{
		{
			"ok",
			func(db *gorm.DB) error {
				return nil
			},
			&mockEncrypter{
				result: []byte("shhhhh,secret"),
			},
			func(db *gorm.DB) error {
				var account Account
				if err := db.Find(&account).Where("account_id = ?", "account-id").Error; err != nil {
					return err
				}
				if account.PublicKey == "" {
					return errors.New("Unexpected empty public key")
				}
				if account.EncryptedPrivateKey != "shhhhh,secret" {
					return fmt.Errorf("Unexpected encrypted secret key %v", account.EncryptedPrivateKey)
				}
				return nil
			},
			false,
		},
		{
			"account exists",
			func(db *gorm.DB) error {
				return db.Create(&Account{
					AccountID: "account-id",
				}).Error
			},
			&mockEncrypter{
				result: []byte("shhhhh,secret"),
			},
			func(db *gorm.DB) error {
				return nil
			},
			true,
		},
		{
			"encryption error",
			func(db *gorm.DB) error {
				return nil
			},
			&mockEncrypter{
				err: errors.New("did not work"),
			},
			func(db *gorm.DB) error {
				count := 0
				db.Find(&Account{}).Where("account_id = ?", "account-id").Count(&count)
				if count != 0 {
					return errors.New("Unexpected account creation")
				}
				return nil
			},
			true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, cleanUp := createTestDatabase()
			defer cleanUp()
			if err := test.setup(db); err != nil {
				t.Fatalf("Unexpected error setting up test %v", err)
			}
			relational := &relationalDatabase{
				db:         db,
				encryption: test.encryption,
			}
			err := relational.CreateAccount("account-id")
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
			if err := test.assertion(db); err != nil {
				t.Errorf("Unexpected assertion error %v", err)
			}
		})
	}
}

func TestRelationalDatabase_GetAccount(t *testing.T) {
	tests := []struct {
		name          string
		setup         func(*gorm.DB) error
		includeEvents bool
		eventsSince   string
		assertion     func(persistence.AccountResult) error
		expectError   bool
	}{
		{
			"unknown account",
			func(*gorm.DB) error {
				return nil
			},
			false,
			"",
			func(r persistence.AccountResult) error {
				if !reflect.DeepEqual(r, persistence.AccountResult{}) {
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
			func(r persistence.AccountResult) error {
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
			func(r persistence.AccountResult) error {
				if r.AccountID != "account-id" {
					return fmt.Errorf("unexpected account id %v", r.AccountID)
				}
				if r.EncryptedPrivateKey != "encrypted-secret-key" {
					return fmt.Errorf("unexpected secret key %v", r.EncryptedPrivateKey)
				}
				userID := "hashed-user-id"
				if !reflect.DeepEqual(r.Events, &persistence.EventsByAccountID{
					"account-id": []persistence.EventResult{
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
				if !reflect.DeepEqual(r.UserSecrets, &persistence.SecretsByUserID{
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
				db: db,
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
			relational := relationalDatabase{db: db}

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
