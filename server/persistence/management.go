package persistence

import (
	"encoding/base64"
	"fmt"

	"github.com/offen/offen/server/keys"
)

func (p *persistenceLayer) InviteUser(invitee, providerAccountUserID, providerPassword string) ([]byte, error) {
	{
		// First, we need to check whether the given address is already associated
		// with an existing account.
		accountUsers, err := p.dal.FindAccountUsers(FindAccountUsersQueryAllAccountUsers{true})
		if err != nil {
			return nil, fmt.Errorf("persistence: error looking up account users: %w", err)
		}
		if _, err := findAccountUser(accountUsers, invitee); err == nil {
			return nil, fmt.Errorf("persistence: account user with address %s already exists", invitee)
		}
	}

	provider, findErr := p.dal.FindAccountUser(FindAccountUserQueryByAccountUserIDIncludeRelationships(providerAccountUserID))
	if findErr != nil {
		return nil, fmt.Errorf("persistence: error looking up account user: %w", findErr)
	}

	{
		// We do not know if the given password is actually correct yet
		if err := keys.CompareString(providerPassword, provider.HashedPassword); err != nil {
			return nil, fmt.Errorf("persistence: error comparing passwords: %w", err)
		}
	}

	providerKey, deriveKeyErr := keys.DeriveKey(providerPassword, provider.Salt)
	if deriveKeyErr != nil {
		return nil, fmt.Errorf("persistence: error deriving key from email address: %w", deriveKeyErr)
	}

	oneTimeKey, _ := keys.GenerateRandomValue(keys.DefaultEncryptionKeySize)
	oneTimeKeyBytes, _ := base64.StdEncoding.DecodeString(oneTimeKey)

	invitedAccountUser, err := newAccountUser(invitee, "")
	if err != nil {
		return nil, fmt.Errorf("persistence: error creating account user for invitee: %w", err)
	}

	txn, err := p.dal.Transaction()
	if err != nil {
		return nil, fmt.Errorf("persistence: error creating transaction: %w", err)
	}

	if err := txn.CreateAccountUser(invitedAccountUser); err != nil {
		txn.Rollback()
		return nil, fmt.Errorf("persistence: error persisting user record for invitee: %w", err)
	}

	// we copy over all relationship of the provider to the invitee
	for _, providerRelationship := range provider.Relationships {
		inviteeRelationship, err := newAccountUserRelationship(invitedAccountUser.AccountUserID, providerRelationship.AccountID)
		if err != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error creating account user relationship: %w", err)
		}

		decryptedKey, decryptErr := keys.DecryptWith(providerKey, providerRelationship.PasswordEncryptedKeyEncryptionKey)
		if decryptErr != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error decrypting email encrypted key: %w", decryptErr)
		}

		if err := inviteeRelationship.addOneTimeEncryptedKey(decryptedKey, oneTimeKeyBytes); err != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error adding one time key: %w", err)
		}

		if err := inviteeRelationship.addEmailEncryptedKey(decryptedKey, invitedAccountUser.Salt, invitee); err != nil {
			txn.Rollback()
			return nil, fmt.Errorf("persistence: error adding email encrypted key: %w", err)
		}

		if err := txn.CreateAccountUserRelationship(inviteeRelationship); err != nil {
			return nil, fmt.Errorf("persistence: error persisting account user relationship: %w", err)
		}
	}
	if err := txn.Commit(); err != nil {
		return nil, fmt.Errorf("persistence: error comitting transaction: %w", err)
	}
	return oneTimeKeyBytes, nil
}
