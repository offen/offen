package persistence

import (
	"errors"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/offen/offen/server/keys"
)

func (p *persistenceLayer) GetAccount(accountID string, includeEvents bool, eventsSince string) (AccountResult, error) {
	account, err := p.dal.FindAccount(FindAccountQueryIncludeEvents{
		AccountID: accountID,
		Since:     eventsSince,
	})
	if err != nil {
		return AccountResult{}, fmt.Errorf("persistence: error looking up account data: %w", err)
	}
	result := AccountResult{
		AccountID: account.AccountID,
		Name:      account.Name,
		Created:   account.Created,
	}

	if !includeEvents {
		key, err := account.WrapPublicKey()
		if err != nil {
			return AccountResult{}, fmt.Errorf("persistence: error wrapping account public key: %v", err)
		}
		result.PublicKey = key
		return result, nil
	}
	result.EncryptedPrivateKey = account.EncryptedPrivateKey

	eventResults := EventsByAccountID{}
	secrets := EncryptedSecretsByID{}

	for _, evt := range account.Events {
		eventResults[evt.AccountID] = append(eventResults[evt.AccountID], EventResult{
			SecretID:  evt.SecretID,
			EventID:   evt.EventID,
			Payload:   evt.Payload,
			AccountID: evt.AccountID,
		})
		if evt.SecretID != nil {
			secrets[*evt.SecretID] = evt.Secret.EncryptedSecret
		}
	}

	if len(eventResults) != 0 {
		result.Events = &eventResults
	}
	if len(secrets) != 0 {
		result.Secrets = &secrets
	}

	return result, nil
}

func (p *persistenceLayer) AssociateUserSecret(accountID, userID, encryptedUserSecret string) error {
	account, err := p.dal.FindAccount(FindAccountQueryByID(accountID))
	if err != nil {
		return fmt.Errorf(`persistence: error looking up account with id "%s": %w`, accountID, err)
	}

	hashedUserID := account.HashUserID(userID)
	secret, err := p.dal.FindSecret(FindSecretQueryBySecretID(hashedUserID))
	if err != nil {
		var notFound ErrUnknownSecret
		if !errors.As(err, &notFound) {
			return fmt.Errorf("persistence: error looking up user: %v", err)
		}
	} else {
		// In this branch the following case is covered: a user whose hashed
		// identifier is known, has sent a new user secret to be saved. This means
		// all events previously saved using their identifier cannot be accessed
		// by them anymore as the key that has been used to encrypt the event's payloads
		// is not known to the user anymore. This means all events that are
		// currently associated to the identifier will be migrated to a newly
		// created identifier which will be used to "park" them. It is important
		// to update these event's EventIDs as this means they will be considered
		// "deleted" by clients.
		parkedID, parkedIDErr := uuid.NewV4()
		if parkedIDErr != nil {
			return fmt.Errorf("persistence: error creating identifier for parking events: %v", parkedIDErr)
		}
		parkedHash := account.HashUserID(parkedID.String())

		txn, err := p.dal.Transaction()
		if err != nil {
			return fmt.Errorf("persistence: error creating transaction: %w", err)
		}
		if err := txn.CreateSecret(&Secret{
			SecretID:        parkedHash,
			EncryptedSecret: secret.EncryptedSecret,
		}); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error creating user for use as migration target: %w", err)
		}

		if err := txn.DeleteSecret(DeleteSecretQueryBySecretID(secret.SecretID)); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error deleting existing user: %v", err)
		}

		// The previous user is now deleted so all orphaned events need to be
		// copied over to the one used for parking the events.
		var idsToDelete []string
		orphanedEvents, err := txn.FindEvents(FindEventsQueryForSecretIDs{
			SecretIDs: []string{hashedUserID},
		})
		if err != nil {
			return fmt.Errorf("persistence: error looking up orphaned events: %w", err)
		}
		for _, orphan := range orphanedEvents {
			newID, err := newEventID()
			if err != nil {
				txn.Rollback()
				return fmt.Errorf("persistence: error creating new event id: %w", err)
			}

			if err := txn.CreateEvent(&Event{
				EventID:   newID,
				AccountID: orphan.AccountID,
				SecretID:  &parkedHash,
				Payload:   orphan.Payload,
			}); err != nil {
				return fmt.Errorf("persistence: error migrating an existing event: %w", err)
			}
			idsToDelete = append(idsToDelete, orphan.EventID)
		}
		if _, err := txn.DeleteEvents(DeleteEventsQueryByEventIDs(idsToDelete)); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error deleting orphaned events: %w", err)
		}
		if err := txn.Commit(); err != nil {
			return fmt.Errorf("persistence: error committing transaction: %w", err)
		}
	}

	if err := p.dal.CreateSecret(&Secret{
		SecretID:        hashedUserID,
		EncryptedSecret: encryptedUserSecret,
	}); err != nil {
		return fmt.Errorf("persistence: error creating user: %w", err)
	}
	return nil
}

func (p *persistenceLayer) CreateAccount(name, emailAddress, password string) error {
	accountUsers, err := p.dal.FindAccountUsers(FindAccountUsersQueryAllAccountUsers{true})
	if err != nil {
		return fmt.Errorf("persistence: error looking up account users: %w", err)
	}
	match, err := selectAccountUser(accountUsers, emailAddress)
	if err != nil {
		return fmt.Errorf("persistence: error looking up account user %s: %w", emailAddress, err)
	}

	if err := keys.CompareString(password, match.HashedPassword); err != nil {
		return fmt.Errorf("persistence: passwords did not match: %w", err)
	}

	allAccounts, allAccountsErr := p.dal.FindAccounts(FindAccountsQueryAllAccounts{})
	if allAccountsErr != nil {
		return fmt.Errorf("persistence: error looking up all existing accounts: %w", err)
	}
	for _, account := range allAccounts {
		if account.Name == name {
			return fmt.Errorf("persistence: account named %s already exists", name)
		}
	}

	account, key, err := newAccount(name, "")
	if err != nil {
		return fmt.Errorf("persistence: error creating account: %w", err)
	}
	relationship, err := newAccountUserRelationship(match.AccountUserID, account.AccountID)
	if err != nil {
		return fmt.Errorf("persistence: error creating relationship: %w", err)
	}
	if err := relationship.addEmailEncryptedKey(key, match.Salt, emailAddress); err != nil {
		return fmt.Errorf("persistence: error adding email encrypted key: %w", err)
	}
	if err := relationship.addPasswordEncryptedKey(key, match.Salt, password); err != nil {
		return fmt.Errorf("persistence: error adding password encrypted key: %w", err)
	}

	txn, err := p.dal.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	if err := txn.CreateAccount(account); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error persisting account: %w", err)
	}
	if err := txn.CreateAccountUserRelationship(relationship); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error persisting relationship: %w", err)
	}
	if err := txn.Commit(); err != nil {
		return fmt.Errorf("persistence: error committing transaction: %w", err)
	}

	return nil
}
