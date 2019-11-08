package persistence

import (
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/keys"
)

func (r *relationalDatabase) Login(email, password string) (LoginResult, error) {
	hashedEmail, hashedEmailErr := keys.HashEmail(email, r.emailSalt)
	if hashedEmailErr != nil {
		return LoginResult{}, hashedEmailErr
	}

	accountUser, err := r.db.FindAccountUser(
		FindAccountUserQueryByHashedEmail(
			base64.StdEncoding.EncodeToString(hashedEmail),
		),
	)
	if err != nil {
		return LoginResult{}, fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	saltBytes, saltErr := base64.StdEncoding.DecodeString(accountUser.Salt)
	if saltErr != nil {
		return LoginResult{}, fmt.Errorf("persistence: error decoding salt: %w", saltErr)
	}

	pwBytes, pwErr := base64.StdEncoding.DecodeString(accountUser.HashedPassword)
	if pwErr != nil {
		return LoginResult{}, fmt.Errorf("persistence: error decoding stored password: %w", pwErr)
	}
	if err := keys.ComparePassword(password, pwBytes); err != nil {
		return LoginResult{}, fmt.Errorf("persistence: error comparing passwords: %w", err)
	}

	pwDerivedKey, pwDerivedKeyErr := keys.DeriveKey(password, saltBytes)
	if pwDerivedKeyErr != nil {
		return LoginResult{}, fmt.Errorf("persistence: error deriving key from password: %w", pwDerivedKeyErr)
	}

	relationships, err := r.db.FindAccountUserRelationships(
		FindAccountUserRelationShipsQueryByUserID(accountUser.UserID),
	)
	if err != nil {
		return LoginResult{}, fmt.Errorf("persistence: error retrieving account to user relationships: %w", err)
	}

	var results []LoginAccountResult
	for _, relationship := range relationships {
		chunks := strings.Split(relationship.PasswordEncryptedKeyEncryptionKey, " ")
		nonce, _ := base64.StdEncoding.DecodeString(chunks[0])
		key, _ := base64.StdEncoding.DecodeString(chunks[1])

		decryptedKey, decryptedKeyErr := keys.DecryptWith(pwDerivedKey, key, nonce)
		if decryptedKeyErr != nil {
			return LoginResult{}, fmt.Errorf("persistence: failed decrypting key encryption key for account %s: %v", relationship.AccountID, decryptedKeyErr)
		}
		k, kErr := jwk.New(decryptedKey)
		if kErr != nil {
			return LoginResult{}, kErr
		}

		account, err := r.db.FindAccount(FindAccountQueryByID(relationship.AccountID))
		if err != nil {
			return LoginResult{}, fmt.Errorf(`persistence: error looking up account with id "%s": %w`, relationship.AccountID, err)
		}

		result := LoginAccountResult{
			AccountName:      account.Name,
			AccountID:        relationship.AccountID,
			KeyEncryptionKey: k,
		}
		results = append(results, result)
	}

	return LoginResult{
		UserID:   accountUser.UserID,
		Accounts: results,
	}, nil
}

func (r *relationalDatabase) LookupUser(userID string) (LoginResult, error) {
	accountUser, err := r.db.FindAccountUser(
		FindAccountUserQueryByUserIDIncludeRelationships(userID),
	)
	if err != nil {
		return LoginResult{}, fmt.Errorf("persistence: error looking up account user: %w", err)
	}
	result := LoginResult{
		UserID:   accountUser.UserID,
		Accounts: []LoginAccountResult{},
	}
	for _, relationship := range accountUser.Relationships {
		result.Accounts = append(result.Accounts, LoginAccountResult{
			AccountID: relationship.AccountID,
		})
	}
	return result, nil
}

func (r *relationalDatabase) ChangePassword(userID, currentPassword, changedPassword string) error {
	accountUser, err := r.db.FindAccountUser(
		FindAccountUserQueryByUserIDIncludeRelationships(userID),
	)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	pwBytes, pwErr := base64.StdEncoding.DecodeString(accountUser.HashedPassword)
	if pwErr != nil {
		return fmt.Errorf("persistence: error decoding password: %v", pwErr)
	}
	if err := keys.ComparePassword(currentPassword, pwBytes); err != nil {
		return fmt.Errorf("persistence: current password did not match: %v", err)
	}

	saltBytes, saltErr := base64.StdEncoding.DecodeString(accountUser.Salt)
	if saltErr != nil {
		return fmt.Errorf("persistence: error decoding salt: %v", saltErr)
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
		return fmt.Errorf("persistence: error hashing new password: %v", hashErr)
	}

	accountUser.HashedPassword = base64.StdEncoding.EncodeToString(newPasswordHash)
	txn, err:= r.db.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	if err := txn.UpdateAccountUser(&accountUser); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error updating password for user: %w", err)
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
		if err := txn.UpdateAccountUserRelationship(&relationship); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error updating keys on relationship: %w", err)
		}
	}
	if err := txn.Commit(); err != nil {
		return fmt.Errorf("persistence: error committing transaction: %w", err)
	}
	return nil
}

func (r *relationalDatabase) ResetPassword(emailAddress, password string, oneTimeKey []byte) error {
	hashedEmail, hashErr := keys.HashEmail(emailAddress, r.emailSalt)
	if hashErr != nil {
		return fmt.Errorf("error hashing given email address: %w", hashErr)
	}

	accountUser, err := r.db.FindAccountUser(
		FindAccountUserQueryByHashedEmail(
			base64.StdEncoding.EncodeToString(hashedEmail),
		),
	)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	saltBytes, saltErr := base64.StdEncoding.DecodeString(accountUser.Salt)
	if saltErr != nil {
		return fmt.Errorf("persistence: error decoding salt for account user: %w", saltErr)
	}

	passwordDerivedKey, deriveErr := keys.DeriveKey(password, saltBytes)
	if deriveErr != nil {
		return fmt.Errorf("persistence: error deriving key from password: %w", deriveErr)
	}

	relationships, err := r.db.FindAccountUserRelationships(
		FindAccountUserRelationShipsQueryByUserID(accountUser.UserID),
	)
	if err != nil {
		return fmt.Errorf("persistence: error looking up relationships: %w", err)
	}

	txn, err := r.db.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	for _, relationship := range relationships {
		chunks := strings.Split(relationship.OneTimeEncryptedKeyEncryptionKey, " ")
		nonce, _ := base64.StdEncoding.DecodeString(chunks[0])
		cipher, _ := base64.StdEncoding.DecodeString(chunks[1])
		keyEncryptionKey, decryptionErr := keys.DecryptWith(oneTimeKey, cipher, nonce)
		if decryptionErr != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error decrypting key encryption key: %v", decryptionErr)
		}
		passwordEncryptedKey, passwordNonce, encryptionErr := keys.EncryptWith(passwordDerivedKey, keyEncryptionKey)
		if encryptionErr != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error re-encrypting key encryption key: %v", encryptionErr)
		}
		relationship.PasswordEncryptedKeyEncryptionKey = fmt.Sprintf(
			"%s %s",
			base64.StdEncoding.EncodeToString(passwordNonce),
			base64.StdEncoding.EncodeToString(passwordEncryptedKey),
		)
		relationship.OneTimeEncryptedKeyEncryptionKey = ""
		if err := txn.UpdateAccountUserRelationship(&relationship); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error updating keys on relationship: %w", err)
		}
	}
	passwordHash, hashErr := keys.HashPassword(password)
	if hashErr != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error hashing password: %v", hashErr)
	}
	accountUser.HashedPassword = base64.StdEncoding.EncodeToString(passwordHash)
	if err := txn.UpdateAccountUser(&accountUser); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error updating password on account user: %w", err)
	}
	if err := txn.Commit(); err != nil {
		return fmt.Errorf("persistence: error committing transaction: %w", err)
	}
	return nil
}

func (r *relationalDatabase) ChangeEmail(userID, emailAddress, password string) error {
	accountUser, err := r.db.FindAccountUser(
		FindAccountUserQueryByUserIDIncludeRelationships(userID),
	)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	pwBytes, pwErr := base64.StdEncoding.DecodeString(accountUser.HashedPassword)
	if pwErr != nil {
		return fmt.Errorf("persistence: error decoding password: %v", pwErr)
	}
	if err := keys.ComparePassword(password, pwBytes); err != nil {
		return fmt.Errorf("persistence: current password did not match: %v", err)
	}

	saltBytes, saltErr := base64.StdEncoding.DecodeString(accountUser.Salt)
	if saltErr != nil {
		return fmt.Errorf("persistence: error decoding salt: %v", saltErr)
	}

	keyFromCurrentPassword, keyErr := keys.DeriveKey(password, saltBytes)
	if keyErr != nil {
		return fmt.Errorf("persistence: error deriving key from password: %v", keyErr)
	}

	emailDerivedKey, deriveKeyErr := keys.DeriveKey(emailAddress, saltBytes)
	if deriveKeyErr != nil {
		return fmt.Errorf("persistence: error deriving key from email address: %v", deriveKeyErr)
	}

	hashedEmail, hashErr := keys.HashEmail(emailAddress, r.emailSalt)
	if hashErr != nil {
		return fmt.Errorf("persistence: error hashing updated email address: %v", hashErr)
	}

	accountUser.HashedEmail = base64.StdEncoding.EncodeToString(hashedEmail)
	txn, err := r.db.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	if err := txn.UpdateAccountUser(&accountUser); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error updating hashed email on account user: %w", err)
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
		if err := txn.UpdateAccountUserRelationship(&relationship); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error updating keys on relationship: %w", err)
		}
		if err := txn.Commit(); err != nil {
			return fmt.Errorf("persistence: error comitting transaction: %w", err)
		}
	}
	return nil
}

func (r *relationalDatabase) GenerateOneTimeKey(emailAddress string) ([]byte, error) {
	hashedEmail, hashErr := keys.HashEmail(emailAddress, r.emailSalt)
	if hashErr != nil {
		return nil, fmt.Errorf("error hashing given email address: %v", hashErr)
	}

	accountUser, err := r.db.FindAccountUser(
		FindAccountUserQueryByHashedEmailIncludeRelationships(
			base64.StdEncoding.EncodeToString(hashedEmail),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("persistence: error looking up account user: %w", err)
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

	txn, err := r.db.Transaction()
	if err !=  nil {
		return nil, fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	for _, relationship := range accountUser.Relationships {
		chunks := strings.Split(relationship.EmailEncryptedKeyEncryptionKey, " ")
		nonce, _ := base64.StdEncoding.DecodeString(chunks[0])
		cipher, _ := base64.StdEncoding.DecodeString(chunks[1])
		decryptedKey, decryptErr := keys.DecryptWith(emailDerivedKey, cipher, nonce)
		if decryptErr != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error decrypting email encrypted key: %v", decryptErr)
		}
		oneTimeEncryptedKey, nonce, encryptErr := keys.EncryptWith(oneTimeKeyBytes, decryptedKey)
		if encryptErr != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error encrypting key with one time key: %v", encryptErr)
		}
		relationship.OneTimeEncryptedKeyEncryptionKey = fmt.Sprintf(
			"%s %s",
			base64.StdEncoding.EncodeToString(nonce),
			base64.StdEncoding.EncodeToString(oneTimeEncryptedKey),
		)
		if err := txn.UpdateAccountUserRelationship(&relationship); err != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error updating relationship record: %v", err)
		}
		if err := txn.Commit(); err != nil{
			return nil, fmt.Errorf("persistence: error committing transaction: %w", err)
		}
	}
	return oneTimeKeyBytes, nil
}
