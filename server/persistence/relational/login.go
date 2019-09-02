package relational

import (
	"encoding/base64"
	"fmt"
	"strings"

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

	pwDerivedKey, pwDerivedKeyErr := keys.DeriveKey(password, []byte(accountUser.Salt))
	if pwDerivedKeyErr != nil {
		return nil, pwDerivedKeyErr
	}

	var relationships []AccountUserRelationship
	r.db.Where("user_id = ?", accountUser.UserID).Find(&relationships)

	var results []persistence.LoginResult
	for _, relationship := range relationships {
		chunks := strings.Split(relationship.PasswordEncryptedKeyEncryptionKey, " ")
		nonce, _ := base64.StdEncoding.DecodeString(chunks[0])
		key, _ := base64.StdEncoding.DecodeString(chunks[1])

		decryptedKey, decryptedKeyErr := keys.DecryptWith(pwDerivedKey, key, nonce)
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
