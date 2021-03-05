// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"time"

	uuid "github.com/gofrs/uuid"
	jwk "github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/keys"
)

// ProbeEmpty checks whether the connected database is empty
func (p *persistenceLayer) ProbeEmpty() bool {
	return p.dal.ProbeEmpty()
}

// BootstrapConfig contains data about accounts and account users that is used
// to seed an application database from scratch.
type BootstrapConfig struct {
	Accounts     []BootstrapAccount     `yaml:"accounts"`
	AccountUsers []BootstrapAccountUser `yaml:"account_users"`
	Force        bool
}

// BootstrapAccount contains the information needed for creating an account at
// bootstrap time.
type BootstrapAccount struct {
	AccountID    string             `yaml:"id"`
	Name         string             `yaml:"name"`
	WithFakeData *BootstrapFakeData `yaml:"with_fake_data"`
}

// BootstrapFakeData configures how to populate an account with fake data
type BootstrapFakeData struct {
	NumUsers  int      `yaml:"num_users"`
	URLs      []string `yaml:"urls"`
	Referrers []string `yaml:"referrers"`
}

// BootstrapAccountUser contains the information needed for creating an account
// user at bootstrap time.
type BootstrapAccountUser struct {
	Email                 string                `yaml:"email"`
	Password              string                `yaml:"password"`
	Accounts              []string              `yaml:"accounts"`
	AdminLevel            AccountUserAdminLevel `yaml:"admin_level"`
	AllowInsecurePassword bool
}

type accountCreation struct {
	encryptionKey []byte
	account       Account
}

// BootstrapProgress signals information about the progress of bootstrapping the
// database
type BootstrapProgress struct {
	Err  error
	Done *uint
}

// Bootstrap seeds a blank database with the given account and user
// data. This is likely only ever used in development.
func (p *persistenceLayer) Bootstrap(config BootstrapConfig) chan BootstrapProgress {
	out := make(chan BootstrapProgress)
	go func() {
		defer close(out)

		for _, user := range config.AccountUsers {
			if user.AllowInsecurePassword {
				continue
			}
			if err := keys.ValidatePassword(user.Password); err != nil {
				out <- BootstrapProgress{
					Err: fmt.Errorf("persistence: error validating password for user %s: %w", user.Email, err),
				}
				return
			}
		}
		if !config.Force {
			if !p.dal.ProbeEmpty() {
				out <- BootstrapProgress{
					Err: errors.New("persistence: action would overwrite existing data - not allowed"),
				}
				return
			}
		}
		txn, err := p.dal.Transaction()
		if err != nil {
			out <- BootstrapProgress{
				Err: fmt.Errorf("persistence: error creating transaction: %w", err),
			}
			return
		}
		if err := txn.DropAll(); err != nil {
			txn.Rollback()
			out <- BootstrapProgress{
				Err: fmt.Errorf("persistence: error dropping tables before inserting seed data: %w", err),
			}
			return
		}

		if err := txn.ApplyMigrations(); err != nil {
			txn.Rollback()
			out <- BootstrapProgress{
				Err: fmt.Errorf("persistence: error applying initial migrations: %w", err),
			}
			return
		}

		accounts, accountUsers, relationships, events, secrets, err := bootstrapAccounts(&config)
		if err != nil {
			txn.Rollback()
			out <- BootstrapProgress{
				Err: fmt.Errorf("persistence: error creating seed data: %w", err),
			}
			return
		}
		for _, secret := range secrets {
			if err := txn.CreateSecret(&secret); err != nil {
				txn.Rollback()
				out <- BootstrapProgress{
					Err: fmt.Errorf("persistence: error creating secret: %w", err),
				}
				return
			}
		}
		for _, event := range events {
			if err := txn.CreateEvent(&event); err != nil {
				txn.Rollback()
				out <- BootstrapProgress{
					Err: fmt.Errorf("persistence: error creating event: %w", err),
				}
				return
			}
		}
		for _, account := range accounts {
			if err := txn.CreateAccount(&account); err != nil {
				txn.Rollback()
				out <- BootstrapProgress{
					Err: fmt.Errorf("persistence: error creating account: %w", err),
				}
				return
			}
		}
		for _, accountUser := range accountUsers {
			if err := txn.CreateAccountUser(&accountUser); err != nil {
				txn.Rollback()
				out <- BootstrapProgress{
					Err: fmt.Errorf("persistence: error creating account user: %w", err),
				}
				return
			}
		}
		for _, relationship := range relationships {
			if err := txn.CreateAccountUserRelationship(&relationship); err != nil {
				txn.Rollback()
				out <- BootstrapProgress{
					Err: fmt.Errorf("persistence: error creating account user relationship: %w", err),
				}
				return
			}
		}

		if err := txn.Commit(); err != nil {
			out <- BootstrapProgress{
				Err: fmt.Errorf("persistence: error committing seed data: %w", err),
			}
			return
		}
	}()
	return out
}

func bootstrapAccounts(config *BootstrapConfig) ([]Account, []AccountUser, []AccountUserRelationship, []Event, []Secret, error) {
	var accountCreations []accountCreation
	var events []Event
	var secrets []Secret

	for _, account := range config.Accounts {
		record, encryptionKey, err := newAccount(account.Name, account.AccountID)
		if err != nil {
			return nil, nil, nil, nil, nil, fmt.Errorf("persistence: error creating new account %s: %w", account.Name, err)
		}
		accountCreations = append(accountCreations, accountCreation{
			account:       *record,
			encryptionKey: encryptionKey,
		})
	}

	accountUserCreations := []AccountUser{}
	relationshipCreations := []AccountUserRelationship{}

	for _, accountUserData := range config.AccountUsers {
		accountUser, err := newAccountUser(accountUserData.Email, accountUserData.Password, accountUserData.AdminLevel)
		if err != nil {
			return nil, nil, nil, nil, nil, err
		}
		accountUserCreations = append(accountUserCreations, *accountUser)

		for _, accountID := range accountUserData.Accounts {
			var encryptionKey []byte
			for _, creation := range accountCreations {
				if creation.account.AccountID == accountID {
					encryptionKey = creation.encryptionKey
					break
				}
			}
			if encryptionKey == nil {
				return nil, nil, nil, nil, nil, fmt.Errorf("account with id %s not found", accountID)
			}

			r, err := newAccountUserRelationship(accountUser.AccountUserID, accountID)
			if err != nil {
				return nil, nil, nil, nil, nil, fmt.Errorf("persistence: error creating account user relationship: %w", err)
			}
			if err := r.addPasswordEncryptedKey(encryptionKey, accountUser.Salt, accountUserData.Password); err != nil {
				return nil, nil, nil, nil, nil, fmt.Errorf("persistence: error adding password encrypted key: %w", err)
			}
			if err := r.addEmailEncryptedKey(encryptionKey, accountUser.Salt, accountUserData.Email); err != nil {
				return nil, nil, nil, nil, nil, fmt.Errorf("persistence: error adding email encrypted key: %w", err)
			}

			relationshipCreations = append(relationshipCreations, *r)
		}
	}
	var accounts []Account
	for _, creation := range accountCreations {
		accounts = append(accounts, creation.account)
	}

	return accounts, accountUserCreations, relationshipCreations, events, secrets, nil
}

func newAccountUser(email, password string, adminLevel interface{}) (*AccountUser, error) {
	var level AccountUserAdminLevel
	switch c := adminLevel.(type) {
	case int:
		level = AccountUserAdminLevel(c)
	case AccountUserAdminLevel:
		level = c
	default:
		return nil, fmt.Errorf("persistence: cannot use %v as admin level", adminLevel)
	}

	accountUserID, idErr := uuid.NewV4()
	if idErr != nil {
		return nil, idErr
	}
	hashedEmail, hashedEmailErr := keys.HashString(email)
	if hashedEmailErr != nil {
		return nil, hashedEmailErr
	}
	salt, saltErr := keys.NewSalt(keys.DefaultSaltLength)
	if saltErr != nil {
		return nil, saltErr
	}
	a := &AccountUser{
		AccountUserID: accountUserID.String(),
		Salt:          salt.Marshal(),
		AdminLevel:    level,
		HashedEmail:   hashedEmail.Marshal(),
	}

	if password != "" {
		hashedPw, hashedPwErr := keys.HashString(password)
		if hashedPwErr != nil {
			return nil, hashedPwErr
		}
		a.HashedPassword = hashedPw.Marshal()
	}

	return a, nil
}

func newAccount(name, accountID string) (*Account, []byte, error) {
	if name == "" {
		return nil, nil, fmt.Errorf("persistence: cannot create an account with an empty name")
	}
	if accountID == "" {
		randomID, err := uuid.NewV4()
		if err != nil {
			return nil, nil, fmt.Errorf("persistence: error creating random account id: %w", err)
		}
		accountID = randomID.String()
	} else {
		_, err := uuid.FromString(accountID)
		if err != nil {
			return nil, nil, fmt.Errorf("persistence: received malformed account id, expected valid uuid: %w", err)
		}
	}

	publicKey, privateKey, keyErr := keys.GenerateRSAKeypair(keys.RSAKeyLength)
	if keyErr != nil {
		return nil, nil, keyErr
	}

	encryptionKey, encryptionKeyErr := keys.GenerateRandomBytes(keys.DefaultEncryptionKeySize)
	if encryptionKeyErr != nil {
		return nil, nil, encryptionKeyErr
	}
	encryptedPrivateKey, encryptedPrivateKeyErr := keys.EncryptWith(encryptionKey, privateKey)
	if encryptedPrivateKeyErr != nil {
		return nil, nil, encryptedPrivateKeyErr
	}

	salt, saltErr := keys.NewFastSalt(keys.DefaultSecretLength)
	if saltErr != nil {
		return nil, nil, saltErr
	}

	return &Account{
		AccountID:           accountID,
		Name:                name,
		PublicKey:           string(publicKey),
		EncryptedPrivateKey: encryptedPrivateKey.Marshal(),
		UserSalt:            salt.Marshal(),
		Retired:             false,
		Created:             time.Now(),
	}, encryptionKey, nil
}

func newAccountUserRelationship(accountUserID, accountID string) (*AccountUserRelationship, error) {
	randomID, err := uuid.NewV4()
	if err != nil {
		return nil, fmt.Errorf("persistence: error creating random id for relationship: %w", err)
	}
	return &AccountUserRelationship{
		RelationshipID: randomID.String(),
		AccountUserID:  accountUserID,
		AccountID:      accountID,
	}, nil
}

func mustSecret(length int) []byte {
	secret, err := keys.GenerateRandomValue(16)
	if err != nil {
		panic(err)
	}
	b, err := base64.StdEncoding.DecodeString(secret)
	if err != nil {
		panic(err)
	}
	return b
}

func newFakeUser() (string, []byte, []byte, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return "", nil, nil, fmt.Errorf("error creating user id: %w", err)
	}
	k, err := keys.GenerateRandomBytes(keys.DefaultSecretLength)
	if err != nil {
		return "", nil, nil, fmt.Errorf("error creating user key: %w", err)
	}
	j, err := jwk.New(k)
	if err != nil {
		return "", nil, nil, fmt.Errorf("error wrapping key as jwk: %w", err)
	}
	j.Set(jwk.AlgorithmKey, "A128GCM")
	j.Set("ext", true)
	j.Set(jwk.KeyOpsKey, jwk.KeyOperationList{jwk.KeyOpEncrypt, jwk.KeyOpDecrypt})
	b, err := json.Marshal(j)
	if err != nil {
		return "", nil, nil, fmt.Errorf("error marshaling jwk: %w", err)
	}
	return id.String(), k, b, nil
}

func (p *persistenceLayer) createFakeSession(account Account, urls, referrers []string) error {
	userID, key, jwk, err := newFakeUser()
	if err != nil {
		return err
	}
	encryptedSecret, encryptionErr := keys.EncryptAsymmetricWith(
		account.PublicKey, jwk,
	)
	if encryptionErr != nil {
		return err
	}
	if err := p.AssociateUserSecret(
		account.AccountID, userID, encryptedSecret.Marshal(),
	); err != nil {
		return err
	}

	for s := 0; s < randomInRange(1, 4); s++ {
		evts := newFakeSession(
			urls, referrers,
			randomInRange(1, 12),
		)
		for _, evt := range evts {
			b, bErr := json.Marshal(evt)
			if bErr != nil {
				return err
			}
			event, eventErr := keys.EncryptWith(key, b)
			if eventErr != nil {
				return err
			}
			eventID, _ := EventIDAt(evt.Timestamp)
			if err := p.Insert(
				userID,
				account.AccountID,
				event.Marshal(),
				&eventID,
			); err != nil {
				return err
			}
		}
	}
	return nil
}

func randomInRange(lower, upper int) int {
	return rand.Intn(upper-lower) + lower
}

func randomBool(prob float64) bool {
	return prob <= rand.Float64()
}

type fakeEvent struct {
	Type      string    `json:"type"`
	Href      string    `json:"href"`
	Title     string    `json:"title"`
	Referrer  string    `json:"referrer"`
	Pageload  int       `json:"pageload"`
	IsMobile  bool      `json:"isMobile"`
	Timestamp time.Time `json:"timestamp"`
	SessionID string    `json:"sessionId"`
}

func sample(xs []string) string {
	return xs[randomInRange(0, len(xs)-1)]
}

func newFakeSession(urls, referrers []string, length int) []*fakeEvent {
	var result []*fakeEvent
	sessionID, _ := uuid.NewV4()
	timestamp := time.Now().Add(-time.Duration(randomInRange(0, int(config.EventRetention))))
	isMobileSession := randomBool(0.33)

	for i := 0; i < length; i++ {
		var referrer string
		if i == 0 && randomBool(0.25) {
			referrer = sample(referrers)
		}
		result = append(result, &fakeEvent{
			Type:      "PAGEVIEW",
			Href:      sample(urls),
			Title:     "Page Title",
			Referrer:  referrer,
			Pageload:  randomInRange(400, 1200),
			IsMobile:  isMobileSession,
			Timestamp: timestamp,
			SessionID: sessionID.String(),
		})
		timestamp = timestamp.Add(time.Duration(randomInRange(0, 10000)))
	}
	return result
}
