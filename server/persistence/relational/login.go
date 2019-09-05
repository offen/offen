package relational

import (
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) Login(email, password string) (persistence.LoginResult, error) {
	var accountUser AccountUser
	hashedEmail, hashedEmailErr := keys.HashEmail(email, r.emailSalt)
	if hashedEmailErr != nil {
		return persistence.LoginResult{}, hashedEmailErr
	}
	if err := r.db.Where("hashed_email = ?", base64.StdEncoding.EncodeToString(hashedEmail)).First(&accountUser).Error; err != nil {
		return persistence.LoginResult{}, err
	}
	if err := keys.ComparePassword(password, accountUser.HashedPassword); err != nil {
		return persistence.LoginResult{}, err
	}

	pwDerivedKey, pwDerivedKeyErr := keys.DeriveKey(password, []byte(accountUser.Salt))
	if pwDerivedKeyErr != nil {
		return persistence.LoginResult{}, pwDerivedKeyErr
	}

	var relationships []AccountUserRelationship
	r.db.Where("user_id = ?", accountUser.UserID).Find(&relationships)

	var results []persistence.LoginAccountResult
	for _, relationship := range relationships {
		chunks := strings.Split(relationship.PasswordEncryptedKeyEncryptionKey, " ")
		nonce, _ := base64.StdEncoding.DecodeString(chunks[0])
		key, _ := base64.StdEncoding.DecodeString(chunks[1])

		decryptedKey, decryptedKeyErr := keys.DecryptWith(pwDerivedKey, key, nonce)
		if decryptedKeyErr != nil {
			return persistence.LoginResult{}, fmt.Errorf("relational: failed decrypting key encryption key for account %s: %v", relationship.AccountID, decryptedKeyErr)
		}
		k, kErr := jwk.New(decryptedKey)
		if kErr != nil {
			return persistence.LoginResult{}, kErr
		}

		var account Account
		if err := r.db.Where("account_id = ?", relationship.AccountID).First(&account).Error; err != nil {
			return persistence.LoginResult{}, err
		}

		result := persistence.LoginAccountResult{
			AccountName:      account.Name,
			AccountID:        relationship.AccountID,
			KeyEncryptionKey: k,
		}
		results = append(results, result)
	}

	return persistence.LoginResult{
		UserID:   accountUser.UserID,
		Accounts: results,
	}, nil
}

func (r *relationalDatabase) LookupUser(userID string) (persistence.LoginResult, error) {
	var user AccountUser
	if err := r.db.Preload("Relationships").Where("user_id = ?", userID).First(&user).Error; err != nil {
		return persistence.LoginResult{}, err
	}
	result := persistence.LoginResult{
		UserID:   user.UserID,
		Accounts: []persistence.LoginAccountResult{},
	}
	for _, relationship := range user.Relationships {
		result.Accounts = append(result.Accounts, persistence.LoginAccountResult{
			AccountID: relationship.AccountID,
		})
	}
	return result, nil
}
