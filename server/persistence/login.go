package persistence

import (
	"encoding/base64"
	"sync"
	"fmt"

	"github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/keys"
)

func (p *persistenceLayer) Login(email, password string) (LoginResult, error) {
	accountUsers, err := p.dal.FindAccountUsers(FindAccountUsersQueryAllAccountUsers{})
	if err != nil {
		return LoginResult{}, fmt.Errorf("persistence: error looking up account users: %w", err)
	}

	accountUser, err := findAccountUser(accountUsers, email)
	if err != nil {
		return LoginResult{}, fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	if err := keys.CompareString(password, accountUser.HashedPassword); err != nil {
		return LoginResult{}, fmt.Errorf("persistence: error comparing passwords: %w", err)
	}

	pwDerivedKey, pwDerivedKeyErr := keys.DeriveKey(password, accountUser.Salt)
	if pwDerivedKeyErr != nil {
		return LoginResult{}, fmt.Errorf("persistence: error deriving key from password: %w", pwDerivedKeyErr)
	}

	relationships, err := p.dal.FindAccountUserRelationships(
		FindAccountUserRelationshipsQueryByAccountUserID(accountUser.AccountUserID),
	)
	if err != nil {
		return LoginResult{}, fmt.Errorf("persistence: error retrieving account to user relationships: %w", err)
	}

	var results []LoginAccountResult
	for _, relationship := range relationships {
		decryptedKey, decryptedKeyErr := keys.DecryptWith(pwDerivedKey, relationship.PasswordEncryptedKeyEncryptionKey)
		if decryptedKeyErr != nil {
			return LoginResult{}, fmt.Errorf("persistence: failed decrypting key encryption key for account %s: %w", relationship.AccountID, decryptedKeyErr)
		}
		k, kErr := jwk.New(decryptedKey)
		if kErr != nil {
			return LoginResult{}, kErr
		}

		account, err := p.dal.FindAccount(FindAccountQueryByID(relationship.AccountID))
		if err != nil {
			return LoginResult{}, fmt.Errorf(`persistence: error looking up account with id "%s": %w`, relationship.AccountID, err)
		}

		result := LoginAccountResult{
			AccountName: account.Name,
			AccountID:   relationship.AccountID,
			Created:     account.Created,
			KeyEncryptionKey: k,
		}
		results = append(results, result)
	}

	return LoginResult{
		AccountUserID:   accountUser.AccountUserID,
		Accounts: results,
	}, nil
}

func (p *persistenceLayer) LookupAccountUser(accountUserID string) (LoginResult, error) {
	accountUser, err := p.dal.FindAccountUser(
		FindAccountUserQueryByAccountUserIDIncludeRelationships(accountUserID),
	)
	if err != nil {
		return LoginResult{}, fmt.Errorf("persistence: error looking up account user: %w", err)
	}
	result := LoginResult{
		AccountUserID:   accountUser.AccountUserID,
		Accounts: []LoginAccountResult{},
	}
	for _, relationship := range accountUser.Relationships {
		result.Accounts = append(result.Accounts, LoginAccountResult{
			AccountID: relationship.AccountID,
		})
	}
	return result, nil
}

func (p *persistenceLayer) ChangePassword(userID, currentPassword, changedPassword string) error {
	accountUser, err := p.dal.FindAccountUser(
		FindAccountUserQueryByAccountUserIDIncludeRelationships(userID),
	)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	if err := keys.CompareString(currentPassword, accountUser.HashedPassword); err != nil {
		return fmt.Errorf("persistence: current password did not match: %w", err)
	}

	keyFromCurrentPassword, keyErr := keys.DeriveKey(currentPassword, accountUser.Salt)
	if keyErr != nil {
		return keyErr
	}

	keyFromChangedPassword, keyErr := keys.DeriveKey(changedPassword, accountUser.Salt)
	if keyErr != nil {
		return keyErr
	}

	newPasswordHash, hashErr := keys.HashString(changedPassword)
	if hashErr != nil {
		return fmt.Errorf("persistence: error hashing new password: %w", hashErr)
	}

	accountUser.HashedPassword = newPasswordHash.Marshal()
	txn, err := p.dal.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	if err := txn.UpdateAccountUser(&accountUser); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error updating password for user: %w", err)
	}

	for _, relationship := range accountUser.Relationships {
		decryptedKey, decryptionErr := keys.DecryptWith(keyFromCurrentPassword, relationship.PasswordEncryptedKeyEncryptionKey)
		if decryptionErr != nil {
			txn.Rollback()
			return decryptionErr
		}
		reencryptedKey, reencryptionErr := keys.EncryptWith(keyFromChangedPassword, decryptedKey)
		if reencryptionErr != nil {
			txn.Rollback()
			return reencryptionErr
		}
		relationship.PasswordEncryptedKeyEncryptionKey = reencryptedKey.Marshal()
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

func (p *persistenceLayer) ResetPassword(emailAddress, password string, oneTimeKey []byte) error {
	accountUsers, err := p.dal.FindAccountUsers(FindAccountUsersQueryAllAccountUsers{})
	if err != nil {
		return fmt.Errorf("persistence: error looking up account users: %w", err)
	}

	accountUser, err := findAccountUser(accountUsers, emailAddress)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	passwordDerivedKey, deriveErr := keys.DeriveKey(password, accountUser.Salt)
	if deriveErr != nil {
		return fmt.Errorf("persistence: error deriving key from password: %w", deriveErr)
	}

	relationships, err := p.dal.FindAccountUserRelationships(
		FindAccountUserRelationshipsQueryByAccountUserID(accountUser.AccountUserID),
	)
	if err != nil {
		return fmt.Errorf("persistence: error looking up relationships: %w", err)
	}

	txn, err := p.dal.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	for _, relationship := range relationships {
		keyEncryptionKey, decryptionErr := keys.DecryptWith(oneTimeKey, relationship.OneTimeEncryptedKeyEncryptionKey)
		if decryptionErr != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error decrypting key encryption key: %w", decryptionErr)
		}
		passwordEncryptedKey, encryptionErr := keys.EncryptWith(passwordDerivedKey, keyEncryptionKey)
		if encryptionErr != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error re-encrypting key encryption key: %w", encryptionErr)
		}
		relationship.PasswordEncryptedKeyEncryptionKey = passwordEncryptedKey.Marshal()
		relationship.OneTimeEncryptedKeyEncryptionKey = ""
		if err := txn.UpdateAccountUserRelationship(&relationship); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error updating keys on relationship: %w", err)
		}
	}
	passwordHash, hashErr := keys.HashString(password)
	if hashErr != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error hashing password: %w", hashErr)
	}
	accountUser.HashedPassword = passwordHash.Marshal()
	if err := txn.UpdateAccountUser(accountUser); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error updating password on account user: %w", err)
	}
	if err := txn.Commit(); err != nil {
		return fmt.Errorf("persistence: error committing transaction: %w", err)
	}
	return nil
}

func (p *persistenceLayer) ChangeEmail(userID, emailAddress, password string) error {
	accountUser, err := p.dal.FindAccountUser(
		FindAccountUserQueryByAccountUserIDIncludeRelationships(userID),
	)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	if err := keys.CompareString(password, accountUser.HashedPassword); err != nil {
		return fmt.Errorf("persistence: current password did not match: %w", err)
	}

	keyFromCurrentPassword, keyErr := keys.DeriveKey(password, accountUser.Salt)
	if keyErr != nil {
		return fmt.Errorf("persistence: error deriving key from password: %w", keyErr)
	}

	emailDerivedKey, deriveKeyErr := keys.DeriveKey(emailAddress, accountUser.Salt)
	if deriveKeyErr != nil {
		return fmt.Errorf("persistence: error deriving key from email address: %w", deriveKeyErr)
	}

	hashedEmail, hashErr := keys.HashString(emailAddress)
	if hashErr != nil {
		return fmt.Errorf("persistence: error hashing updated email address: %w", hashErr)
	}

	accountUser.HashedEmail = hashedEmail.Marshal()
	txn, err := p.dal.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	if err := txn.UpdateAccountUser(&accountUser); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error updating hashed email on account user: %w", err)
	}
	for _, relationship := range accountUser.Relationships {
		decryptedKey, decryptionErr := keys.DecryptWith(keyFromCurrentPassword, relationship.PasswordEncryptedKeyEncryptionKey)
		if decryptionErr != nil {
			txn.Rollback()
			return decryptionErr
		}
		reencryptedKey, reencryptionErr := keys.EncryptWith(emailDerivedKey, decryptedKey)
		if reencryptionErr != nil {
			txn.Rollback()
			return reencryptionErr
		}
		relationship.EmailEncryptedKeyEncryptionKey = reencryptedKey.Marshal()
		if err := txn.UpdateAccountUserRelationship(&relationship); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error updating keys on relationship: %w", err)
		}
	}
	if err := txn.Commit(); err != nil {
		return fmt.Errorf("persistence: error comitting transaction: %w", err)
	}
	return nil
}

func (p *persistenceLayer) GenerateOneTimeKey(emailAddress string) ([]byte, error) {
	accountUsers, err := p.dal.FindAccountUsers(FindAccountUsersQueryAllAccountUsers{true})
	if err != nil {
		return nil, fmt.Errorf("persistence: error looking up account users: %w", err)
	}

	accountUser, err := findAccountUser(accountUsers, emailAddress)
	if err != nil {
		return nil, fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	emailDerivedKey, deriveErr := keys.DeriveKey(emailAddress, accountUser.Salt)
	if deriveErr != nil {
		return nil, fmt.Errorf("error deriving key from email address: %w", deriveErr)
	}
	oneTimeKey, _ := keys.GenerateRandomValue(keys.DefaultEncryptionKeySize)
	oneTimeKeyBytes, _ := base64.StdEncoding.DecodeString(oneTimeKey)

	txn, err := p.dal.Transaction()
	if err != nil {
		return nil, fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	for _, relationship := range accountUser.Relationships {
		decryptedKey, decryptErr := keys.DecryptWith(emailDerivedKey, relationship.EmailEncryptedKeyEncryptionKey)
		if decryptErr != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error decrypting email encrypted key: %w", decryptErr)
		}
		oneTimeEncryptedKey, encryptErr := keys.EncryptWith(oneTimeKeyBytes, decryptedKey)
		if encryptErr != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error encrypting key with one time key: %w", encryptErr)
		}
		relationship.OneTimeEncryptedKeyEncryptionKey = oneTimeEncryptedKey.Marshal()
		if err := txn.UpdateAccountUserRelationship(&relationship); err != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error updating relationship record: %w", err)
		}
	}
	if err := txn.Commit(); err != nil {
		return nil, fmt.Errorf("persistence: error committing transaction: %w", err)
	}
	return oneTimeKeyBytes, nil
}

func findAccountUser(available []AccountUser, email string) (*AccountUser, error) {
	match := make(chan AccountUser)
	allDone := make(chan bool)
	wg := sync.WaitGroup{}

	for _, accountUser := range available {
		wg.Add(1)
		go func(a AccountUser) {
			if err := keys.CompareString(email, a.HashedEmail); err == nil {
				match <- a
			}
			wg.Done()
		} (accountUser)
	}
	go func () {
		wg.Wait()
		allDone <- true
	} ()

	select {
	case accountUser := <-match:
		return &accountUser, nil
	case <-allDone :
		return nil, fmt.Errorf("persistence: no account user found for %s", email)
	}
}
