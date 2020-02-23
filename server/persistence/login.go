package persistence

import (
	"context"
	"encoding/base64"
	"fmt"
	"sync"

	"github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/keys"
)

func (p *persistenceLayer) Login(email, password string) (LoginResult, error) {
	accountUser, err := p.findAccountUser(email, true)
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

	var results []LoginAccountResult
	for _, relationship := range accountUser.Relationships {
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
			AccountName:      account.Name,
			AccountID:        relationship.AccountID,
			Created:          account.Created,
			KeyEncryptionKey: k,
		}
		results = append(results, result)
	}

	return LoginResult{
		AccountUserID: accountUser.AccountUserID,
		Accounts:      results,
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
		AccountUserID: accountUser.AccountUserID,
		Accounts:      []LoginAccountResult{},
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

	keyFromCurrentPassword, keyErr := keys.DeriveKey(currentPassword, accountUser.Salt)
	if keyErr != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error deriving key from password: %w", keyErr)
	}

	for _, relationship := range accountUser.Relationships {
		decryptedKey, decryptErr := keys.DecryptWith(keyFromCurrentPassword, relationship.PasswordEncryptedKeyEncryptionKey)
		if decryptErr != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error decrypting key using password: %w", decryptErr)
		}
		if err := relationship.addPasswordEncryptedKey(decryptedKey, accountUser.Salt, changedPassword); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error updating password encrypted key: %w", err)
		}
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
	accountUser, err := p.findAccountUser(emailAddress, true)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	txn, err := p.dal.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	for _, relationship := range accountUser.Relationships {
		keyEncryptionKey, decryptionErr := keys.DecryptWith(oneTimeKey, relationship.OneTimeEncryptedKeyEncryptionKey)
		if decryptionErr != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error decrypting key encryption key: %w", decryptionErr)
		}
		if err := relationship.addPasswordEncryptedKey(keyEncryptionKey, accountUser.Salt, password); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error adding password encrypted key to relationship: %w", err)
		}
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
		if err := relationship.addEmailEncryptedKey(decryptedKey, accountUser.Salt, emailAddress); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error adding email key to relationship: %w", err)
		}
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
	accountUser, err := p.findAccountUser(emailAddress, true)
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
		if err := relationship.addOneTimeEncryptedKey(decryptedKey, oneTimeKeyBytes); err != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: erro adding one time key to relationship: %w", err)
		}
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

func (p *persistenceLayer) findAccountUser(emailAddress string, includeRelationships bool) (*AccountUser, error) {
	accountUsers, err := p.dal.FindAccountUsers(FindAccountUsersQueryAllAccountUsers{IncludeRelationships: includeRelationships})
	if err != nil {
		return nil, fmt.Errorf("persistence: error looking up account users: %w", err)
	}
	match, err := selectAccountUser(accountUsers, emailAddress)
	if err != nil {
		return nil, fmt.Errorf("persistence: could not find user with email %s: %w", emailAddress, err)
	}
	return match, nil
}

func selectAccountUser(available []AccountUser, email string) (*AccountUser, error) {
	ctx, cancel := context.WithCancel(context.Background())
	match := make(chan AccountUser)
	wg := sync.WaitGroup{}
	for _, a := range available {
		wg.Add(1)
		go func(accountUser AccountUser) {
			if err := keys.CompareString(email, accountUser.HashedEmail); err == nil {
				match <- accountUser
			}
			wg.Done()
		}(a)
	}
	go func() {
		wg.Wait()
		cancel()
	}()
	select {
	case result := <-match:
		return &result, nil
	case <-ctx.Done():
		return nil, fmt.Errorf("persistence: no account user found for %s", email)
	}
}
