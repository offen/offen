package relational

import (
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"

	"github.com/mendsley/gojwk"
)

// Event is any analytics event that will be stored in the database. It is
// uniquely tied to an Account and a User model.
type Event struct {
	EventID      string `gorm:"primary_key"`
	AccountID    string
	HashedUserID string
	Payload      string
	Account      Account `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
	User         User    `gorm:"foreignkey:HashedUserID;association_foreignkey:HashedUserID"`
}

// User associates a hashed user id - which ties a user and account together
// uniquely - with the encrypted user secret the account owner can use
// to decrypt events stored for that user.
type User struct {
	HashedUserID        string `gorm:"primary_key"`
	EncryptedUserSecret string
}

// Account stores information about an account.
type Account struct {
	AccountID          string `gorm:"primary_key"`
	PublicKey          string
	EncryptedSecretKey string
	UserSalt           string
}

// HashUserID uses the account's `UserSalt` to create a hashed version of a
// user identifier that is unique per account.
func (a *Account) HashUserID(userID string) string {
	joined := fmt.Sprintf("%s-%s", a.UserSalt, userID)
	hashed := sha256.Sum256([]byte(joined))
	return fmt.Sprintf("%x", hashed)
}

// WrapPublicKey returns the public key of an account's keypair in
// JSON WebKey format.
func (a *Account) WrapPublicKey() (*gojwk.Key, error) {
	decoded, _ := pem.Decode([]byte(a.PublicKey))

	if decoded == nil {
		return nil, errors.New("failed decoding stored key value")
	}

	pub, pubErr := x509.ParsePKCS1PublicKey(decoded.Bytes)
	if pubErr != nil {
		return nil, pubErr
	}

	key, keyErr := gojwk.PublicKey(pub)
	if keyErr != nil {
		return nil, keyErr
	}
	return key, nil
}
