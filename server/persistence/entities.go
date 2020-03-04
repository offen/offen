package persistence

import (
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	jwk "github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/keys"
)

// Event is any analytics event that will be stored in the database. It is
// uniquely tied to an Account and a Secret model.
type Event struct {
	EventID   string
	AccountID string
	// the secret id is nullable for anonymous events
	SecretID *string
	Payload  string
	Secret   Secret
}

// Secret associates a hashed user id - which ties a user and account together
// uniquely - with the encrypted user secret the account owner can use
// to decrypt events stored for that user.
type Secret struct {
	SecretID        string
	EncryptedSecret string
}

// AccountUser is a person that can log in and access data related to all
// associated accounts.
type AccountUser struct {
	AccountUserID  string
	HashedEmail    string
	HashedPassword string
	Salt           string
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
}

func (a *AccountUserRelationship) addOneTimeEncryptedKey(encryptionKey, oneTimeKey []byte) error {
	oneTimeEncryptedKey, encryptErr := keys.EncryptWith(oneTimeKey, encryptionKey)
	if encryptErr != nil {
		return fmt.Errorf("persistence: error adding one time key to relationship %w", encryptErr)
	}
	a.OneTimeEncryptedKeyEncryptionKey = oneTimeEncryptedKey.Marshal()
	return nil
}

func (a *AccountUserRelationship) addEmailEncryptedKey(encryptionKey []byte, salt, emailAddress string) error {
	emailDerivedKey, deriveErr := keys.DeriveKey(emailAddress, salt)
	if deriveErr != nil {
		return fmt.Errorf("persistence: error deriving key from email: %w", deriveErr)
	}
	emailEncryptedKey, encryptErr := keys.EncryptWith(emailDerivedKey, encryptionKey)
	if encryptErr != nil {
		return fmt.Errorf("persistence: error encrypting email derived key: %w", encryptErr)
	}
	a.EmailEncryptedKeyEncryptionKey = emailEncryptedKey.Marshal()
	return nil
}

func (a *AccountUserRelationship) addPasswordEncryptedKey(encryptionKey []byte, salt, password string) error {
	passwordDerivedKey, deriveErr := keys.DeriveKey(password, salt)
	if deriveErr != nil {
		return fmt.Errorf("persistence: error deriving key from password: %w", deriveErr)
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
func (a *Account) HashUserID(userID string) string {
	b, _ := base64.StdEncoding.DecodeString(a.UserSalt)
	joined := append([]byte(userID), b...)
	hashed := sha256.Sum256(joined)
	return fmt.Sprintf("%x", hashed)
}

// WrapPublicKey returns the public key of an account's keypair in
// JSON WebKey format.
func (a *Account) WrapPublicKey() (jwk.Key, error) {
	s, err := jwk.ParseString(a.PublicKey)
	if err != nil {
		return nil, errors.New("persistence: failed decoding stored key value")
	}
	return s.Keys[0], nil
}
