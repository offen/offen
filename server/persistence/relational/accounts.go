package relational

import (
	"fmt"

	"github.com/gofrs/uuid"
	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) GetAccount(accountID string, events bool) (persistence.AccountResult, error) {
	var account Account
	queryDB := r.db
	if events {
		queryDB = queryDB.Preload("Events").Preload("Events.User")
	}
	if err := queryDB.Find(&account, "account_id = ?", accountID).Error; err != nil {
		if gorm.IsRecordNotFoundError(err) {
			return persistence.AccountResult{}, persistence.ErrUnknownAccount(fmt.Sprintf("account id %s unknown", accountID))
		}
		return persistence.AccountResult{}, err
	}

	key, err := account.WrapPublicKey()
	if err != nil {
		return persistence.AccountResult{}, err
	}

	result := persistence.AccountResult{
		AccountID:          account.AccountID,
		PublicKey:          key,
		EncryptedSecretKey: account.EncryptedSecretKey,
	}

	eventResults := persistence.EventsByAccountID{}
	userSecrets := persistence.SecretsByUserID{}

	for _, evt := range account.Events {
		eventResults[evt.AccountID] = append(eventResults[evt.AccountID], persistence.EventResult{
			UserID:  evt.HashedUserID,
			EventID: evt.EventID,
			Payload: evt.Payload,
		})
		userSecrets[evt.HashedUserID] = evt.User.EncryptedUserSecret
	}
	if len(eventResults) != 0 {
		result.Events = &eventResults
		result.UserSecrets = &userSecrets
	}

	return result, nil
}

func (r *relationalDatabase) AssociateUserSecret(accountID, userID, encryptedUserSecret string) error {
	var account Account
	if err := r.db.Find(&account, "account_id = ?", accountID).Error; err != nil {
		return err
	}
	hashedUserID := account.HashUserID(userID)

	var user User
	txn := r.db.Begin()
	// there is an issue with the postgres backend of GORM that disallows inserting
	// primary keys when using `FirstOrCreate`, so we need to do a manual check
	// for existence beforehand
	if err := r.db.First(&user, "hashed_user_id = ?", hashedUserID).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			return err
		}
	} else {
		parkedID, parkedIDErr := uuid.NewV4()
		if parkedIDErr != nil {
			txn.Rollback()
			return parkedIDErr
		}
		parkedHash := account.HashUserID(parkedID.String())

		if err := txn.Model(&user).Update("hashed_user_id", parkedHash).Error; err != nil {
			txn.Rollback()
			return err
		}

		var affected []Event
		txn.Find(&affected, "hashed_user_id = ?", parkedHash)
		for _, ev := range affected {
			newID, err := newEventID()
			if err != nil {
				txn.Rollback()
				return err
			}
			if err := txn.Model(&ev).Updates(map[string]interface{}{
				"event_id":       newID,
				"hashed_user_id": parkedHash,
			}).Error; err != nil {
				txn.Rollback()
				return err
			}
		}
	}

	if err := txn.Create(&User{
		EncryptedUserSecret: encryptedUserSecret,
		HashedUserID:        hashedUserID,
	}).Error; err != nil {
		txn.Rollback()
		return err
	}

	return txn.Commit().Error
}
