package relational

import (
	"errors"
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) GetAccount(accountID string, includeEvents bool, eventsSince string) (persistence.AccountResult, error) {
	account, err := r.findAccount(FindAccountQueryIncludeEvents{
		AccountID: accountID,
		Since:     eventsSince,
	})
	if err != nil {
		return persistence.AccountResult{}, fmt.Errorf("persistence: error looking up account data: %w", err)
	}
	result := persistence.AccountResult{
		AccountID: account.AccountID,
		Name:      account.Name,
	}

	if includeEvents {
		result.EncryptedPrivateKey = account.EncryptedPrivateKey
	} else {
		key, err := account.WrapPublicKey()
		if err != nil {
			return persistence.AccountResult{}, fmt.Errorf("persistence: error wrapping account public key: %v", err)
		}
		result.PublicKey = key
	}

	eventResults := persistence.EventsByAccountID{}
	userSecrets := persistence.SecretsByUserID{}

	for _, evt := range account.Events {
		eventResults[evt.AccountID] = append(eventResults[evt.AccountID], persistence.EventResult{
			UserID:    evt.HashedUserID,
			EventID:   evt.EventID,
			Payload:   evt.Payload,
			AccountID: evt.AccountID,
		})
		if evt.HashedUserID != nil {
			userSecrets[*evt.HashedUserID] = evt.User.EncryptedUserSecret
		}
	}

	if len(eventResults) != 0 {
		result.Events = &eventResults
	}
	if len(userSecrets) != 0 {
		result.UserSecrets = &userSecrets
	}

	return result, nil
}

func (r *relationalDatabase) AssociateUserSecret(accountID, userID, encryptedUserSecret string) error {
	account, err := r.findAccount(FindAccountQueryByID(accountID))
	if err != nil {
		return fmt.Errorf(`persistence: error looking up account with id "%s": %w`, accountID, err)
	}

	hashedUserID := account.HashUserID(userID)
	user, err := r.findUser(FindUserQueryByHashedUserID(hashedUserID))
	// there is an issue with the Postgres backend of GORM that disallows inserting
	// primary keys when using `FirstOrCreate`, so we need to do a manual check
	// for existence beforehand.
	if err != nil {
		var notFound persistence.ErrUnknownUser
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

		if err := r.createUser(&User{
			HashedUserID:        parkedHash,
			EncryptedUserSecret: user.EncryptedUserSecret,
		}); err != nil {
			return fmt.Errorf("persistence: error creating user for use as migration target: %w", err)
		}

		if err := r.deleteUser(DeleteUserQueryByHashedID(user.HashedUserID)); err != nil {
			return fmt.Errorf("persistence: error deleting existing user: %v", err)
		}

		// The previous user is now deleted so all orphaned events need to be
		// copied over to the one used for parking the events.
		var orphanedEvents []Event
		var idsToDelete []string
		orphanedEvents, err := r.findEvents(FindEventsQueryForHashedIDs{
			HashedUserIDs: []string{hashedUserID},
		})
		if err != nil {
			return fmt.Errorf("persistence: error looking up orphaned events: %w", err)
		}
		for _, orphan := range orphanedEvents {
			newID, err := newEventID()
			if err != nil {
				return fmt.Errorf("persistence: error creating new event id: %w", err)
			}

			if err := r.createEvent(&Event{
				EventID:      newID,
				AccountID:    orphan.AccountID,
				HashedUserID: &parkedHash,
				Payload:      orphan.Payload,
			}); err != nil {
				return fmt.Errorf("persistence: error migrating an existing event: %w", err)
			}
			idsToDelete = append(idsToDelete, orphan.EventID)
		}
		if _, err := r.deleteEvents(DeleteEventsQueryByEventIDs(idsToDelete)); err != nil {
			return fmt.Errorf("relational: error deleting orphaned events: %w", err)
		}
	}

	if err := r.createUser(&User{
		EncryptedUserSecret: encryptedUserSecret,
		HashedUserID:        hashedUserID,
	}); err != nil {
		return fmt.Errorf("persistence: error creating user: %w", err)
	}
	return nil
}
