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
				if account.Name != "account-name" {
					return fmt.Errorf("Unexpected account name %v", account.Name)
				}
				if account.PublicKey == "" {
					return errors.New("Unexpected empty public key")
				}
				if account.EncryptedSecretKey != "shhhhh,secret" {
					return fmt.Errorf("Unexpected encrypted secret key %v", account.EncryptedSecretKey)
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
					Name:      "account-name",
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
			err := relational.CreateAccount("account-id", "account-name")
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
					return fmt.Errorf("unexpected result %#v\n", r)
				}
				return nil
			},
			true,
		},
		{
			"without events",
			func(db *gorm.DB) error {
				return db.Create(&Account{
					AccountID:          "account-id",
					Name:               "test-name",
					PublicKey:          publicKey,
					EncryptedSecretKey: "encrypted-secret-key",
					UserSalt:           "user-salt",
				}).Error
			},
			false,
			"",
			func(r persistence.AccountResult) error {
				if r.AccountID != "account-id" {
					return fmt.Errorf("unexpected account id %v", r.AccountID)
				}
				if r.EncryptedSecretKey != "" {
					return fmt.Errorf("expected empty secret key, got %v", r.EncryptedSecretKey)
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
					AccountID:          "account-id",
					Name:               "test-name",
					PublicKey:          publicKey,
					EncryptedSecretKey: "encrypted-secret-key",
					UserSalt:           "user-salt",
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
				if r.EncryptedSecretKey != "encrypted-secret-key" {
					return fmt.Errorf("unexpected secret key %v", r.EncryptedSecretKey)
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
