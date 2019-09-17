package relational

import (
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"

	jwk "github.com/lestrrat-go/jwx/jwk"
)

// Event is any analytics event that will be stored in the database. It is
// uniquely tied to an Account and a User model.
type Event struct {
	EventID   string `gorm:"primary_key"`
	AccountID string
	// the user id is nullable for anonymous events
	HashedUserID *string
	Payload      string
	User         User `gorm:"foreignkey:HashedUserID;association_foreignkey:HashedUserID"`
}

// User associates a hashed user id - which ties a user and account together
// uniquely - with the encrypted user secret the account owner can use
// to decrypt events stored for that user.
type User struct {
	HashedUserID        string `gorm:"primary_key"`
	EncryptedUserSecret string
}

// AccountUser is a person that can log in and access data related to all
// associated accounts.
type AccountUser struct {
	UserID         string `gorm:"primary_key"`
	HashedEmail    string
	HashedPassword string
	Salt           string
	Relationships  []AccountUserRelationship `gorm:"foreignkey:UserID;association_foreignkey:UserID"`
}

// AccountUserRelationship contains the encrypted KeyEncryptionKeys needed for
// an AccountUser to access the data of the account it links to.
type AccountUserRelationship struct {
	RelationshipID                    string `gorm:"primary_key"`
	UserID                            string
	AccountID                         string
	PasswordEncryptedKeyEncryptionKey string
	EmailEncryptedKeyEncryptionKey    string
}

// Account stores information about an account.
type Account struct {
	AccountID           string `gorm:"primary_key"`
	Name                string
	PublicKey           string
	EncryptedPrivateKey string
	UserSalt            string
	Retired             bool
	Events              []Event `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
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
		return nil, errors.New("failed decoding stored key value")
	}
	return s.Keys[0], nil
}
