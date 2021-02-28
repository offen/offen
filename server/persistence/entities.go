// Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/keys"
)

// Event is any analytics event that will be stored in the database. It is
// uniquely tied to an Account and a Secret model.
type Event struct {
	EventID   string
	Sequence  string
	AccountID string
	// the secret id is nullable for anonymous events
	SecretID *string
	Payload  string
	Secret   Secret
}

// A Tombstone replaces an event on its deletion
type Tombstone struct {
	EventID   string
	AccountID string
	SecretID  *string
	Sequence  string
}

// Secret associates a hashed user id - which ties a user and account together
// uniquely - with the encrypted user secret the account owner can use
// to decrypt events stored for that user.
type Secret struct {
	SecretID        string
	EncryptedSecret string
}

// AccountUserAdminLevel is used to describe the privileges granted to an account
// user. If zero, no admin privileges are given.
type AccountUserAdminLevel int

// A SuperAdmin is the only level currently used. It is granted any possible
// privilege.
const (
	AccountUserAdminLevelSuperAdmin AccountUserAdminLevel = 1
)

// AccountUser is a person that can log in and access data related to all
// associated accounts.
type AccountUser struct {
	AccountUserID  string
	HashedEmail    string
	HashedPassword string
	Salt           string
	AdminLevel     AccountUserAdminLevel
	Relationships  []AccountUserRelationship
}

// AccountUserRelationship contains the encrypted KeyEncryptionKeys needed for
// an AccountUser to access the data of the account it links to.
type AccountUserRelationship struct {
	RelationshipID                    string
	AccountUserID                     string
	AccountID                         string
	PasswordEncryptedKeyEncryptionKey string
	EmailEncryptedKeyEncryptionKey    string
	OneTimeEncryptedKeyEncryptionKey  string
	// this cache is used to prevent deriving the same email or password based
	// key over and over again when updating a large number of relationships
	keyCache     map[string][]byte
	keyCacheLock *sync.Mutex
}

func (a *AccountUserRelationship) ensureCache() {
	if a.keyCache == nil {
		a.keyCache = map[string][]byte{}
	}
	if a.keyCacheLock == nil {
		a.keyCacheLock = &sync.Mutex{}
	}
}

func (a *AccountUserRelationship) getCacheItem(key string) []byte {
	a.ensureCache()

	a.keyCacheLock.Lock()
	defer a.keyCacheLock.Unlock()

	if item, ok := a.keyCache[key]; ok {
		return item
	}
	return nil
}

func (a *AccountUserRelationship) setCacheItem(key string, value []byte) {
	a.ensureCache()

	a.keyCacheLock.Lock()
	defer a.keyCacheLock.Unlock()

	a.keyCache[key] = value
}

func (a *AccountUserRelationship) addOneTimeEncryptedKey(encryptionKey, oneTimeKey []byte) error {
	oneTimeEncryptedKey, encryptErr := keys.EncryptWith(oneTimeKey, encryptionKey)
	if encryptErr != nil {
		return fmt.Errorf("persistence: error adding one time key to relationship %w", encryptErr)
	}
	a.OneTimeEncryptedKeyEncryptionKey = oneTimeEncryptedKey.Marshal()
	return nil
}

func (a *AccountUserRelationship) addEmailEncryptedKey(encryptionKey []byte, versionedSalt, emailAddress string) error {
	emailDerivedKey := a.getCacheItem(emailAddress + versionedSalt)
	if emailDerivedKey == nil {
		var err error
		emailDerivedKey, err = keys.DeriveKey(emailAddress, versionedSalt)
		if err != nil {
			return fmt.Errorf("persistence: error deriving key from email: %w", err)
		}
		a.setCacheItem(emailAddress+versionedSalt, emailDerivedKey)
	}
	emailEncryptedKey, encryptErr := keys.EncryptWith(emailDerivedKey, encryptionKey)
	if encryptErr != nil {
		return fmt.Errorf("persistence: error encrypting email derived key: %w", encryptErr)
	}
	a.EmailEncryptedKeyEncryptionKey = emailEncryptedKey.Marshal()
	return nil
}

func (a *AccountUserRelationship) addPasswordEncryptedKey(encryptionKey []byte, versionedSalt, password string) error {
	passwordDerivedKey := a.getCacheItem(password + versionedSalt)
	if passwordDerivedKey == nil {
		var err error
		passwordDerivedKey, err = keys.DeriveKey(password, versionedSalt)
		if err != nil {
			return fmt.Errorf("persistence: error deriving key from password: %w", err)
		}
		a.setCacheItem(password+versionedSalt, passwordDerivedKey)
	}
	passwordEncryptedKey, encryptErr := keys.EncryptWith(passwordDerivedKey, encryptionKey)
	if encryptErr != nil {
		return fmt.Errorf("persistence: error encrypting key with password derived key: %w", encryptErr)
	}
	a.PasswordEncryptedKeyEncryptionKey = passwordEncryptedKey.Marshal()
	return nil
}

// Account stores information about an account.
type Account struct {
	AccountID           string
	Name                string
	PublicKey           string
	EncryptedPrivateKey string
	UserSalt            string
	Retired             bool
	Created             time.Time
	Events              []Event
}

// HashUserID uses the account's `UserSalt` to create a hashed version of a
// user identifier that is unique per account.
func (a *Account) HashUserID(userID string) (string, error) {
	result, err := keys.HashFast(userID, a.UserSalt)
	if err != nil {
		return "", err
	}
	return result, nil
}

// WrapPublicKey returns the public key of an account's keypair in
// JSON WebKey format.
func (a *Account) WrapPublicKey() (jwk.Key, error) {
	s, err := jwk.ParseString(a.PublicKey)
	if err != nil {
		return nil, errors.New("persistence: failed decoding stored key value")
	}
	key, ok := s.Get(0)
	if !ok {
		return nil, errors.New("persistence: found empty keyset")
	}
	return key, nil
}
