package persistence

import (
	"encoding/base64"
	"fmt"

	"github.com/offen/offen/server/keys"
)

func (p *persistenceLayer) InviteUser(inviteeEmail, providerAccountUserID, providerPassword, accountID string) (InviteUserResult, error) {
	var result InviteUserResult
	var invitedAccountUser *AccountUser
	{
		// First, we need to check whether the given address is already associated
		// with an existing account.
		accountUsers, err := p.dal.FindAccountUsers(FindAccountUsersQueryAllAccountUsers{true})
		if err != nil {
			return result, fmt.Errorf("persistence: error looking up account users: %w", err)
		}
		if match, err := findAccountUser(accountUsers, inviteeEmail); err == nil {
			result.UserExists = true
			invitedAccountUser = match
		} else {
			newAccountUserRecord, err := newAccountUser(inviteeEmail, "")
			if err != nil {
				return result, fmt.Errorf("persistence: error creating new account user for invitee: %w", err)
			}
			invitedAccountUser = newAccountUserRecord
			if err := p.dal.CreateAccountUser(invitedAccountUser); err != nil {
				return result, fmt.Errorf("persistence: error persisting new account user for invitee: %w", err)
			}
		}
	}

	provider, findErr := p.dal.FindAccountUser(FindAccountUserQueryByAccountUserIDIncludeRelationships(providerAccountUserID))
	if findErr != nil {
		return result, fmt.Errorf("persistence: error looking up account user: %w", findErr)
	}

	{
		// We do not know if the given password is actually correct yet
		if err := keys.CompareString(providerPassword, provider.HashedPassword); err != nil {
			return result, fmt.Errorf("persistence: error comparing passwords: %w", err)
		}
	}

	providerKey, deriveKeyErr := keys.DeriveKey(providerPassword, provider.Salt)
	if deriveKeyErr != nil {
		return result, fmt.Errorf("persistence: error deriving key from email address: %w", deriveKeyErr)
	}

	oneTimeKey, _ := keys.GenerateRandomValue(keys.DefaultEncryptionKeySize)
	oneTimeKeyBytes, _ := base64.StdEncoding.DecodeString(oneTimeKey)
	result.OneTimeSecret = oneTimeKeyBytes

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
			eligibleRelationships = append(eligibleRelationships, relationship)
		}
	}

	txn, err := p.dal.Transaction()
	if err != nil {
		return result, fmt.Errorf("persistence: error creating transaction: %w", err)
	}

	// we copy over all all eligibile relationships of the provider to the invitee
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

		if err := inviteeRelationship.addOneTimeEncryptedKey(decryptedKey, oneTimeKeyBytes); err != nil {
			txn.Rollback()
			return result, fmt.Errorf("persistence: error adding one time key: %w", err)
		}

		if err := inviteeRelationship.addEmailEncryptedKey(decryptedKey, invitedAccountUser.Salt, inviteeEmail); err != nil {
			txn.Rollback()
			return result, fmt.Errorf("persistence: error adding email encrypted key: %w", err)
		}

		if err := txn.CreateAccountUserRelationship(inviteeRelationship); err != nil {
			return result, fmt.Errorf("persistence: error persisting account user relationship: %w", err)
		}
	}
	if err := txn.Commit(); err != nil {
		return result, fmt.Errorf("persistence: error comitting transaction: %w", err)
	}
	return result, nil
}
