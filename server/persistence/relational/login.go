package relational

import (
	"encoding/base64"
	"encoding/hex"
	"fmt"

	"github.com/lestrrat-go/jwx/jwk"

	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) Login(email, password string) ([]persistence.LoginResult, error) {
	var accountUser AccountUser
	hashedEmail, hashedEmailErr := keys.HashEmail(email, r.emailSalt)
	if hashedEmailErr != nil {
		return nil, hashedEmailErr
	}
	if err := r.db.Where("hashed_email = ?", base64.StdEncoding.EncodeToString(hashedEmail)).First(&accountUser).Error; err != nil {
		return nil, err
	}
	if err := keys.ComparePassword(password, accountUser.HashedPassword); err != nil {
		return nil, err
	}

	fmt.Printf("account user: %#v\n", accountUser)
	pwDerivedKey, pwDerivedKeyErr := keys.DeriveKey(password, []byte(accountUser.Salt))
	if pwDerivedKeyErr != nil {
		return nil, pwDerivedKeyErr
	}

	var relationships []AccountUserRelationship
	r.db.Where("user_id = ?", accountUser.UserID).Find(&relationships)

	var results []persistence.LoginResult
	for _, relationship := range relationships {
		keyBytes, _ := hex.DecodeString(relationship.PasswordEncryptedKeyEncryptionKey)
		decryptedKey, decryptedKeyErr := keys.DecryptWith(pwDerivedKey, keyBytes)
		if decryptedKeyErr != nil {
			return nil, fmt.Errorf("relational: failed decrypting key encryption key for account %s: %v", relationship.AccountID, decryptedKeyErr)
		}
		k, kErr := jwk.New(decryptedKey)
		if kErr != nil {
			return nil, kErr
		}
		result := persistence.LoginResult{
			AccountID:        relationship.AccountID,
			KeyEncryptionKey: k,
		}
		results = append(results, result)
	}

	return results, nil
}
