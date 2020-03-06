// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"fmt"

	"github.com/offen/offen/server/keys"
)

func (p *persistenceLayer) ShareAccount(inviteeEmailAddress, providerEmailAddress, providerPassword, accountID string) (ShareAccountResult, error) {
	var result ShareAccountResult
	var invitedAccountUser *AccountUser

	accountUsers, err := p.dal.FindAccountUsers(FindAccountUsersQueryAllAccountUsers{true, false})
	if err != nil {
		return result, fmt.Errorf("persistence: error looking up account users: %w", err)
	}

	// First, we need to check if the provider has given valid credentials
	provider, findErr := selectAccountUser(accountUsers, providerEmailAddress)
	if findErr != nil {
		return result, fmt.Errorf("persistence: error looking up account user: %w", findErr)
	}
	if err := keys.CompareString(providerPassword, provider.HashedPassword); err != nil {
		return result, fmt.Errorf("persistence: error comparing passwords: %w", err)
	}

	// Next, we need to check whether the given address is already associated
	// with an existing account.
	if match, err := selectAccountUser(accountUsers, inviteeEmailAddress); err == nil {
		if match.HashedPassword != "" {
			result.UserExistsWithPassword = true
		}
		invitedAccountUser = match
	} else {
		newAccountUserRecord, err := newAccountUser(inviteeEmailAddress, "")
		if err != nil {
			return result, fmt.Errorf("persistence: error creating new account user for invitee: %w", err)
		}
		invitedAccountUser = newAccountUserRecord
		if err := p.dal.CreateAccountUser(invitedAccountUser); err != nil {
			return result, fmt.Errorf("persistence: error persisting new account user for invitee: %w", err)
		}
	}

	providerKey, deriveKeyErr := keys.DeriveKey(providerPassword, provider.Salt)
	if deriveKeyErr != nil {
		return result, fmt.Errorf("persistence: error deriving key from email address: %w", deriveKeyErr)
	}

	var eligibleRelationships []AccountUserRelationship
outer:
	for _, relationship := range provider.Relationships {
		for _, existingRelationship := range invitedAccountUser.Relationships {
			if relationship.AccountID == existingRelationship.AccountID {
				// this makes sure no existing relationship for the accountID
				// in question is overwritten
				continue outer
			}
		}
		if accountID == "" || relationship.AccountID == accountID {
			// with no filter given, the invitee inherits all relationships from
			// the provider
			account, accountErr := p.dal.FindAccount(FindAccountQueryByID(relationship.AccountID))
			if accountErr != nil {
				return result, fmt.Errorf("persistence: error looking up account info for relationship %s: %w", relationship.RelationshipID, err)
			}
			result.AccountNames = append(result.AccountNames, account.Name)
			eligibleRelationships = append(eligibleRelationships, relationship)
		}
	}

	txn, err := p.dal.Transaction()
	if err != nil {
		return result, fmt.Errorf("persistence: error creating transaction: %w", err)
	}

	// we copy over all all eligible relationships of the provider to the invitee
	for _, providerRelationship := range eligibleRelationships {
		inviteeRelationship, err := newAccountUserRelationship(invitedAccountUser.AccountUserID, providerRelationship.AccountID)
		if err != nil {
			txn.Rollback()
			return result, fmt.Errorf("persistence: error creating account user relationship: %w", err)
		}

		decryptedKey, decryptErr := keys.DecryptWith(providerKey, providerRelationship.PasswordEncryptedKeyEncryptionKey)
		if decryptErr != nil {
			txn.Rollback()
			return result, fmt.Errorf("persistence: error decrypting email encrypted key: %w", decryptErr)
		}

		if err := inviteeRelationship.addEmailEncryptedKey(decryptedKey, invitedAccountUser.Salt, inviteeEmailAddress); err != nil {
			txn.Rollback()
			return result, fmt.Errorf("persistence: error adding email encrypted key: %w", err)
		}

		if err := txn.CreateAccountUserRelationship(inviteeRelationship); err != nil {
			return result, fmt.Errorf("persistence: error persisting account user relationship: %w", err)
		}
	}
	if err := txn.Commit(); err != nil {
		return result, fmt.Errorf("persistence: error committing transaction: %w", err)
	}
	return result, nil
}

func (p *persistenceLayer) Join(emailAddress, password string) error {
	match, err := p.findAccountUser(emailAddress, true, true)
	if err != nil {
		return fmt.Errorf("persistence: could not find user with email %s: %w", emailAddress, err)
	}

	if match.HashedPassword != "" {
		return fmt.Errorf("persistence: user with email %s has already joined before", emailAddress)
	}

	cipher, err := keys.HashString(password)
	if err != nil {
		return fmt.Errorf("persistence: hashing given password: %w", err)
	}
	match.HashedPassword = cipher.Marshal()

	txn, err := p.dal.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}

	if err := txn.UpdateAccountUser(match); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: failed to update account user: %w", err)
	}

	emailDerivedKey, deriveErr := keys.DeriveKey(emailAddress, match.Salt)
	if deriveErr != nil {
		return fmt.Errorf("persistence: error deriving key from email: %w", deriveErr)
	}

	for _, relationship := range match.Relationships {
		key, keyErr := keys.DecryptWith(emailDerivedKey, relationship.EmailEncryptedKeyEncryptionKey)
		if keyErr != nil {
			return fmt.Errorf("persistence: error decrypting email encrypted key: %w", keyErr)
		}

		if err := relationship.addPasswordEncryptedKey(key, match.Salt, password); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error adding password encrypted key: %w", err)
		}
		if err := txn.UpdateAccountUserRelationship(&relationship); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error persisting account user relationship: %w", err)
		}
	}

	if err := txn.Commit(); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error committing transaction: %w", err)
	}

	return nil
}
