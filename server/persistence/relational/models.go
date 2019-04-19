package relational

import (
	"crypto/sha256"
	"fmt"
)

// Event is any analytics event that will be stored in the database. It is
// uniquely tied to an Account and a User model.
type Event struct {
	EventID      string `gorm:"primary_key"`
	AccountID    string
	HashedUserID string
	Payload      string
	Account      Account `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
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
	hashed := sha256.Sum256([]byte(fmt.Sprintf("%s-%s", a.UserSalt, userID)))
	return fmt.Sprintf("%x", hashed)
}
