// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/keys"
)

func (p *persistenceLayer) Login(email, password string) (LoginResult, error) {
	accountUser, err := p.findAccountUser(email, true, true)
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

	// the account user logging in might have pending invitations which we can
	// populate with proper password encrypted keys now
	for idx, relationship := range accountUser.Relationships {
		if relationship.PasswordEncryptedKeyEncryptionKey != "" {
			continue
		}
		emailDerivedKey, emailDerivedKeyErr := keys.DeriveKey(email, accountUser.Salt)
		if emailDerivedKeyErr != nil {
			return LoginResult{}, fmt.Errorf("persistence: error deriving key from email: %w", emailDerivedKeyErr)
		}
		key, keyErr := keys.DecryptWith(emailDerivedKey, relationship.EmailEncryptedKeyEncryptionKey)
		if keyErr != nil {
			return LoginResult{}, fmt.Errorf("persistence: error decryption email encrypted key: %w", keyErr)
		}
		if err := relationship.addPasswordEncryptedKey(key, accountUser.Salt, password); err != nil {
			return LoginResult{}, fmt.Errorf("persistence: error encrypting key for pending invitation: %w", err)
		}
		if err := p.dal.UpdateAccountUserRelationship(&relationship); err != nil {
			return LoginResult{}, fmt.Errorf("persistence: error accepting pending invitation: %w", err)
		}
		accountUser.Relationships[idx] = relationship
	}

	var results []LoginAccountResult
	for _, relationship := range accountUser.Relationships {
		decryptedKey, decryptedKeyErr := keys.DecryptWith(pwDerivedKey, relationship.PasswordEncryptedKeyEncryptionKey)
		if decryptedKeyErr != nil {
			return LoginResult{}, fmt.Errorf(`persistence: failed decrypting key encryption key for account "%s": %w`, relationship.AccountID, decryptedKeyErr)
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
		AdminLevel:    accountUser.AdminLevel,
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
		AdminLevel:    accountUser.AdminLevel,
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

	if err := keys.ValidatePassword(changedPassword); err != nil {
		return fmt.Errorf("persistence: error validating new password: %w", err)
	}

	newPasswordHash, hashErr := keys.HashString(changedPassword)
	if hashErr != nil {
		return fmt.Errorf("persistence: error hashing new password: %w", hashErr)
	}
	accountUser.HashedPassword = newPasswordHash.Marshal()
	keyFromCurrentPassword, keyErr := keys.DeriveKey(currentPassword, accountUser.Salt)
	if keyErr != nil {
		return fmt.Errorf("persistence: error deriving key from current password: %w", keyErr)
	}

	for index, relationship := range accountUser.Relationships {
		decryptedKey, decryptErr := keys.DecryptWith(keyFromCurrentPassword, relationship.PasswordEncryptedKeyEncryptionKey)
		if decryptErr != nil {
			return fmt.Errorf("persistence: error decrypting key using password: %w", decryptErr)
		}
		if err := relationship.addPasswordEncryptedKey(decryptedKey, accountUser.Salt, changedPassword); err != nil {
			return fmt.Errorf("persistence: error updating password encrypted key: %w", err)
		}
		accountUser.Relationships[index] = relationship
	}
	if err := p.dal.UpdateAccountUser(&accountUser); err != nil {
		return fmt.Errorf("persistence: error updating password for user: %w", err)
	}
	return nil
}

func (p *persistenceLayer) ResetPassword(emailAddress, password string, oneTimeKey []byte) error {
	accountUser, err := p.findAccountUser(emailAddress, true, false)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	if err := keys.ValidatePassword(password); err != nil {
		return fmt.Errorf("persistence: error validating new password: %w", err)
	}

	for index, relationship := range accountUser.Relationships {
		keyEncryptionKey, decryptionErr := keys.DecryptWith(oneTimeKey, relationship.OneTimeEncryptedKeyEncryptionKey)
		if decryptionErr != nil {
			return fmt.Errorf("persistence: error decrypting key encryption key: %w", decryptionErr)
		}
		if err := relationship.addPasswordEncryptedKey(keyEncryptionKey, accountUser.Salt, password); err != nil {
			return fmt.Errorf("persistence: error adding password encrypted key to relationship: %w", err)
		}
		relationship.OneTimeEncryptedKeyEncryptionKey = ""
		accountUser.Relationships[index] = relationship
	}
	passwordHash, hashErr := keys.HashString(password)
	if hashErr != nil {
		return fmt.Errorf("persistence: error hashing password: %w", hashErr)
	}
	accountUser.HashedPassword = passwordHash.Marshal()
	if err := p.dal.UpdateAccountUser(accountUser); err != nil {
		return fmt.Errorf("persistence: error updating password on account user: %w", err)
	}
	return nil
}

func (p *persistenceLayer) ChangeEmail(userID, newEmailAddress, currentEmailAddress, password string) error {
	accountUser, err := p.findAccountUser(currentEmailAddress, true, true)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user: %w", err)
	}

	if accountUser.AccountUserID != userID {
		return errors.New("persistence: current email did not match requester credentials")
	}

	if err := keys.CompareString(password, accountUser.HashedPassword); err != nil {
		return fmt.Errorf("persistence: passwords did not match: %w", err)
	}

	if err := keys.CompareString(currentEmailAddress, accountUser.HashedEmail); err != nil {
		return fmt.Errorf("persistence: current email did not match: %w", err)
	}

	existing, _ := p.findAccountUser(newEmailAddress, false, false)
	if existing != nil && existing.AccountUserID != userID {
		return fmt.Errorf("persistence: given email %s is already in use", newEmailAddress)
	}

	keyFromCurrentEmail, keyErr := keys.DeriveKey(currentEmailAddress, accountUser.Salt)
	if keyErr != nil {
		return fmt.Errorf("persistence: error deriving key from email: %w", keyErr)
	}

	hashedEmail, hashErr := keys.HashString(newEmailAddress)
	if hashErr != nil {
		return fmt.Errorf("persistence: error hashing updated email address: %w", hashErr)
	}

	accountUser.HashedEmail = hashedEmail.Marshal()
	for index, relationship := range accountUser.Relationships {
		decryptedKey, decryptionErr := keys.DecryptWith(keyFromCurrentEmail, relationship.EmailEncryptedKeyEncryptionKey)
		if decryptionErr != nil {
			return decryptionErr
		}
		if err := relationship.addEmailEncryptedKey(decryptedKey, accountUser.Salt, newEmailAddress); err != nil {
			return fmt.Errorf("persistence: error adding email key to relationship: %w", err)
		}
		accountUser.Relationships[index] = relationship
	}
	if err := p.dal.UpdateAccountUser(accountUser); err != nil {
		return fmt.Errorf("persistence: error updating hashed email on account user: %w", err)
	}
	return nil
}

func (p *persistenceLayer) GenerateOneTimeKey(emailAddress string) ([]byte, error) {
	accountUser, err := p.findAccountUser(emailAddress, true, false)
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

func (p *persistenceLayer) findAccountUser(emailAddress string, includeRelationships, IncludeInvitations bool) (*AccountUser, error) {
	accountUsers, err := p.dal.FindAccountUsers(FindAccountUsersQueryAllAccountUsers{
		IncludeRelationships: includeRelationships,
		IncludeInvitations:   IncludeInvitations,
	})
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
	for _, user := range available {
		if err := keys.CompareString(email, user.HashedEmail); err == nil {
			return &user, nil
		}
	}
	return nil, fmt.Errorf("persistence: no account user found for %s", email)
}
