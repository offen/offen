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

	saltBytes, saltErr := base64.StdEncoding.DecodeString(accountUser.Salt)
	if saltErr != nil {
		return persistence.LoginResult{}, fmt.Errorf("relational: error decoding salt: %v", saltErr)
	}

	pwBytes, pwErr := base64.StdEncoding.DecodeString(accountUser.HashedPassword)
	if pwErr != nil {
		return persistence.LoginResult{}, fmt.Errorf("relational: error decoding stored password: %v", pwErr)
	}
	if err := keys.ComparePassword(password, pwBytes); err != nil {
		return persistence.LoginResult{}, err
	}

	pwDerivedKey, pwDerivedKeyErr := keys.DeriveKey(password, saltBytes)
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

func (r *relationalDatabase) ChangePassword(userID, currentPassword, changedPassword string) error {
	var accountUser AccountUser
	if err := r.db.Preload("Relationships").Where("user_id = ?", userID).First(&accountUser).Error; err != nil {
		return fmt.Errorf("relational: error looking up user: %v", err)
	}

	pwBytes, pwErr := base64.StdEncoding.DecodeString(accountUser.HashedPassword)
	if pwErr != nil {
		return fmt.Errorf("relational: error decoding password: %v", pwErr)
	}
	if err := keys.ComparePassword(currentPassword, pwBytes); err != nil {
		return fmt.Errorf("relational: current password did not match: %v", err)
	}

	saltBytes, saltErr := base64.StdEncoding.DecodeString(accountUser.Salt)
	if saltErr != nil {
		return fmt.Errorf("relational: error decoding salt: %v", saltErr)
	}

	keyFromCurrentPassword, keyErr := keys.DeriveKey(currentPassword, saltBytes)
	if keyErr != nil {
		return keyErr
	}

	keyFromChangedPassword, keyErr := keys.DeriveKey(changedPassword, saltBytes)
	if keyErr != nil {
		return keyErr
	}

	newPasswordHash, hashErr := keys.HashPassword(changedPassword)
	if hashErr != nil {
		return fmt.Errorf("relational: error hashing new password: %v", hashErr)
	}

	accountUser.HashedPassword = base64.StdEncoding.EncodeToString(newPasswordHash)
	txn := r.db.Begin()
	if err := txn.Save(&accountUser).Error; err != nil {
		txn.Rollback()
		return err
	}

	for _, relationship := range accountUser.Relationships {
		chunks := strings.Split(relationship.PasswordEncryptedKeyEncryptionKey, " ")
		nonce, _ := base64.StdEncoding.DecodeString(chunks[0])
		value, _ := base64.StdEncoding.DecodeString(chunks[1])
		decryptedKey, decryptionErr := keys.DecryptWith(keyFromCurrentPassword, value, nonce)
		if decryptionErr != nil {
			txn.Rollback()
			return decryptionErr
		}
		reencryptedKey, nonce, reencryptionErr := keys.EncryptWith(keyFromChangedPassword, decryptedKey)
		if reencryptionErr != nil {
			txn.Rollback()
			return reencryptionErr
		}
		relationship.PasswordEncryptedKeyEncryptionKey = base64.StdEncoding.EncodeToString(nonce) + " " + base64.StdEncoding.EncodeToString(reencryptedKey)
		txn.Save(&relationship)
	}

	return txn.Commit().Error
}

func (r *relationalDatabase) ResetPassword(emailAddress, password string, oneTimeKey []byte) error {
	hashedEmail, hashErr := keys.HashEmail(emailAddress, r.emailSalt)
	if hashErr != nil {
		return fmt.Errorf("error hashing given email address: %v", hashErr)
	}

	var accountUser AccountUser
	if err := r.db.Where("hashed_email = ?", base64.StdEncoding.EncodeToString(hashedEmail)).First(&accountUser).Error; err != nil {
		return fmt.Errorf("error looking up user: %v", err)
	}

	saltBytes, saltErr := base64.StdEncoding.DecodeString(accountUser.Salt)
	if saltErr != nil {
		return fmt.Errorf("error decoding salt for account user: %v", saltErr)
	}

	passwordDerivedKey, deriveErr := keys.DeriveKey(password, saltBytes)
	if deriveErr != nil {
		return fmt.Errorf("error deriving key from password: %v", deriveErr)
	}

	var relationships []AccountUserRelationship
	r.db.Where("user_id = ?", accountUser.UserID).Find(&relationships)

	txn := r.db.Begin()
	for _, relationship := range relationships {
		chunks := strings.Split(relationship.OneTimeEncryptedKeyEncryptionKey, " ")
		nonce, _ := base64.StdEncoding.DecodeString(chunks[0])
		cipher, _ := base64.StdEncoding.DecodeString(chunks[1])
		keyEncryptionKey, decryptionErr := keys.DecryptWith(oneTimeKey, cipher, nonce)
		if decryptionErr != nil {
			txn.Rollback()
			return fmt.Errorf("error decrypting key encryption key: %v", decryptionErr)
		}
		passwordEncryptedKey, passwordNonce, encryptionErr := keys.EncryptWith(passwordDerivedKey, keyEncryptionKey)
		if encryptionErr != nil {
			txn.Rollback()
			return fmt.Errorf("error re-encrypting key encryption key: %v", encryptionErr)
		}
		relationship.PasswordEncryptedKeyEncryptionKey = fmt.Sprintf(
			"%s %s",
			base64.StdEncoding.EncodeToString(passwordNonce),
			base64.StdEncoding.EncodeToString(passwordEncryptedKey),
		)
		relationship.OneTimeEncryptedKeyEncryptionKey = ""
		txn.Save(&relationship)
	}
	passwordHash, hashErr := keys.HashPassword(password)
	if hashErr != nil {
		txn.Rollback()
		return fmt.Errorf("error hashing password: %v", hashErr)
	}
	txn.Model(&accountUser).Update("hashed_password", base64.StdEncoding.EncodeToString(passwordHash))
	return txn.Commit().Error
}

func (r *relationalDatabase) ChangeEmail(userID, emailAddress, password string) error {
	var accountUser AccountUser
	if err := r.db.Preload("Relationships").Where("user_id = ?", userID).First(&accountUser).Error; err != nil {
		return fmt.Errorf("relational: error looking up user: %v", err)
	}

	pwBytes, pwErr := base64.StdEncoding.DecodeString(accountUser.HashedPassword)
	if pwErr != nil {
		return fmt.Errorf("relational: error decoding password: %v", pwErr)
	}
	if err := keys.ComparePassword(password, pwBytes); err != nil {
		return fmt.Errorf("relational: current password did not match: %v", err)
	}

	saltBytes, saltErr := base64.StdEncoding.DecodeString(accountUser.Salt)
	if saltErr != nil {
		return fmt.Errorf("relational: error decoding salt: %v", saltErr)
	}

	keyFromCurrentPassword, keyErr := keys.DeriveKey(password, saltBytes)
	if keyErr != nil {
		return fmt.Errorf("relational: error deriving key from password: %v", keyErr)
	}

	emailDerivedKey, deriveKeyErr := keys.DeriveKey(emailAddress, saltBytes)
	if deriveKeyErr != nil {
		return fmt.Errorf("relational: error deriving key from email address: %v", deriveKeyErr)
	}

	hashedEmail, hashErr := keys.HashEmail(emailAddress, r.emailSalt)
	if hashErr != nil {
		return fmt.Errorf("relational: error hashing updated email address: %v", hashErr)
	}

	txn := r.db.Begin()
	accountUser.HashedEmail = base64.StdEncoding.EncodeToString(hashedEmail)
	if err := txn.Save(&accountUser).Error; err != nil {
		txn.Rollback()
		return err
	}
	for _, relationship := range accountUser.Relationships {
		chunks := strings.Split(relationship.PasswordEncryptedKeyEncryptionKey, " ")
		nonce, _ := base64.StdEncoding.DecodeString(chunks[0])
		value, _ := base64.StdEncoding.DecodeString(chunks[1])
		decryptedKey, decryptionErr := keys.DecryptWith(keyFromCurrentPassword, value, nonce)
		if decryptionErr != nil {
			txn.Rollback()
			return decryptionErr
		}
		reencryptedKey, nonce, reencryptionErr := keys.EncryptWith(emailDerivedKey, decryptedKey)
		if reencryptionErr != nil {
			txn.Rollback()
			return reencryptionErr
		}
		relationship.EmailEncryptedKeyEncryptionKey = base64.StdEncoding.EncodeToString(nonce) + " " + base64.StdEncoding.EncodeToString(reencryptedKey)
		txn.Save(&relationship)
	}

	return txn.Commit().Error
}

func (r *relationalDatabase) GenerateOneTimeKey(emailAddress string) ([]byte, error) {
	hashedEmail, hashErr := keys.HashEmail(emailAddress, r.emailSalt)
	if hashErr != nil {
		return nil, fmt.Errorf("error hashing given email address: %v", hashErr)
	}
	
	var accountUser AccountUser
	if err := r.db.Preload("Relationships").Where("hashed_email = ?", base64.StdEncoding.EncodeToString(hashedEmail)).First(&accountUser).Error; err != nil {
		return nil, fmt.Errorf("error looking up user: %v", err) 
	}

	saltBytes, saltErr := base64.StdEncoding.DecodeString(accountUser.Salt)
	if saltErr != nil {
		return nil, fmt.Errorf("error decoding salt for account user: %v", saltErr)
	}

	emailDerivedKey, deriveErr := keys.DeriveKey(emailAddress, saltBytes)
	if deriveErr != nil {
		return nil, fmt.Errorf("error deriving key from email address: %v", deriveErr)
	}
	oneTimeKey, _ := keys.GenerateRandomValue(keys.DefaultEncryptionKeySize)
	oneTimeKeyBytes, _ := base64.StdEncoding.DecodeString(oneTimeKey)

	txn := r.db.Begin()
	for _, relationship := range accountUser.Relationships {
		chunks := strings.Split(relationship.EmailEncryptedKeyEncryptionKey, " ")
		nonce, _ := base64.StdEncoding.DecodeString(chunks[0])
		cipher, _ := base64.StdEncoding.DecodeString(chunks[1])
		decryptedKey, decryptErr := keys.DecryptWith(emailDerivedKey, cipher, nonce)
		if decryptErr != nil {
			txn.Rollback()
			return nil, fmt.Errorf("error decrypting email encrypted key: %v", decryptErr)
		}
		oneTimeEncryptedKey, nonce, encryptErr := keys.EncryptWith(oneTimeKeyBytes, decryptedKey)
		if encryptErr != nil {
			txn.Rollback()
			return nil, fmt.Errorf("error encrypting key with one time key: %v", encryptErr)
		}
		relationship.OneTimeEncryptedKeyEncryptionKey = fmt.Sprintf(
			"%s %s",
			base64.StdEncoding.EncodeToString(nonce),
			base64.StdEncoding.EncodeToString(oneTimeEncryptedKey),
		)
		if err := txn.Save(&relationship).Error; err != nil {
			txn.Rollback()
			return nil, fmt.Errorf("error updating relationship record: %v", err)
		}
	}
	return oneTimeKeyBytes, txn.Commit().Error
}