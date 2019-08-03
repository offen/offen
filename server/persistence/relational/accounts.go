package relational

import (
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) GetAccount(accountID string, includeEvents bool, eventsSince string) (persistence.AccountResult, error) {
	var account Account

	queryDB := r.db
	if includeEvents {
		if eventsSince != "" {
			queryDB = queryDB.Preload("Events", "event_id > ?", eventsSince).Preload("Events.User")
		} else {
			queryDB = queryDB.Preload("Events").Preload("Events.User")
		}
	}

	if err := queryDB.Find(&account, "account_id = ?", accountID).Error; err != nil {
		if gorm.IsRecordNotFoundError(err) {
			return persistence.AccountResult{}, persistence.ErrUnknownAccount(fmt.Sprintf(`relational: account id "%s" unknown`, accountID))
		}
		return persistence.AccountResult{}, fmt.Errorf("relational: error looking up account with id %s: %v", accountID, err)
	}

	result := persistence.AccountResult{
		AccountID: account.AccountID,
	}

	if includeEvents {
		result.EncryptedPrivateKey = account.EncryptedPrivateKey
	} else {
		key, err := account.WrapPublicKey()
		if err != nil {
			return persistence.AccountResult{}, fmt.Errorf("relational: error wrapping account public key: %v", err)
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
	var account Account
	if err := r.db.Find(&account, "account_id = ?", accountID).Error; err != nil {
		return fmt.Errorf("relational: error looking up account with id %s: %v", accountID, err)
	}
	hashedUserID := account.HashUserID(userID)

	var user User
	// there is an issue with the Postgres backend of GORM that disallows inserting
	// primary keys when using `FirstOrCreate`, so we need to do a manual check
	// for existence beforehand.
	if err := r.db.First(&user, "hashed_user_id = ?", hashedUserID).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			return fmt.Errorf("relational: error looking up user: %v", err)
		}
	} else {
		txn := r.db.Begin()
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
			txn.Rollback()
			return fmt.Errorf("relational: error creating identifier for parking events: %v", parkedIDErr)
		}

		parkedHash := account.HashUserID(parkedID.String())
		if err := txn.Create(&User{
			HashedUserID:        parkedHash,
			EncryptedUserSecret: user.EncryptedUserSecret,
		}).Error; err != nil {
			txn.Rollback()
			return fmt.Errorf("relational: error creating user for parking events: %v", err)
		}
		if err := txn.Delete(&user).Error; err != nil {
			txn.Rollback()
			return fmt.Errorf("relational: error deleting existing user: %v", err)
		}

		// The previous user is now deleted so all orphaned events need to be
		// copied over to the one used for parking the events.
		var orphanedEvents []Event
		var idsToDelete []string
		txn.Find(&orphanedEvents, "hashed_user_id = ?", hashedUserID)
		for _, orphan := range orphanedEvents {
			newID, err := newEventID()
			if err != nil {
				txn.Rollback()
				return fmt.Errorf("relational: error creating new event id: %v", err)
			}

			if err := txn.Create(&Event{
				EventID:      newID,
				AccountID:    orphan.AccountID,
				HashedUserID: &parkedHash,
				Payload:      orphan.Payload,
			}).Error; err != nil {
				txn.Rollback()
				return fmt.Errorf("relational: error migrating an existing event: %v", err)
			}
			idsToDelete = append(idsToDelete, orphan.EventID)
		}
		if err := txn.Where("event_id in (?)", idsToDelete).Delete(Event{}).Error; err != nil {
			txn.Rollback()
			return fmt.Errorf("relational: error deleting orphaned events: %v", err)
		}
		if err := txn.Commit().Error; err != nil {
			return fmt.Errorf("relational: error committing migration transaction: %v", err)
		}
	}

	return r.db.Create(&User{
		EncryptedUserSecret: encryptedUserSecret,
		HashedUserID:        hashedUserID,
	}).Error
}

func (r *relationalDatabase) CreateAccount(accountID string) error {
	userSalt, userSaltErr := keys.GenerateRandomString(keys.UserSaltLength)
	if userSaltErr != nil {
		return fmt.Errorf("relational: error creating new user salt for account: %v", userSaltErr)
	}
	publicKey, privateKey, keyErr := keys.GenerateRSAKeypair(keys.RSAKeyLength)
	if keyErr != nil {
		return fmt.Errorf("relational: error creating new key pair for account: %v", keyErr)
	}
	encryptedPrivateKey, encryptErr := r.encryption.Encrypt(privateKey)
	if encryptErr != nil {
		return fmt.Errorf("relational: error encrypting account private key: %v", encryptErr)
	}
	return r.db.Create(&Account{
		AccountID:           accountID,
		PublicKey:           string(publicKey),
		EncryptedPrivateKey: string(encryptedPrivateKey),
		UserSalt:            userSalt,
		Retired:             false,
	}).Error
}
