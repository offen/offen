package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) GetAccount(accountID string) (persistence.AccountResult, error) {
	var account Account
	if err := r.db.Find(&account, "account_id = ?", accountID).Error; err != nil {
		if gorm.IsRecordNotFoundError(err) {
			return persistence.AccountResult{}, persistence.ErrUnknownAccount(fmt.Sprintf("account id %s unknown", accountID))
		}
		return persistence.AccountResult{}, err
	}

	key, err := account.WrapPublicKey()
	if err != nil {
		return persistence.AccountResult{}, err
	}

	return persistence.AccountResult{
		AccountID: account.AccountID,
		PublicKey: *key,
	}, nil
}

func (r *relationalDatabase) AssociateUserSecret(accountID, userID, encryptedUserSecret string) error {
	var account Account
	if err := r.db.Find(&account, "account_id = ?", accountID).Error; err != nil {
		return err
	}
	hashedUserID := account.HashUserID(userID)

	var user User
	// there is an issue with the postgres backend of GORM that disallows inserting
	// primary keys when using `FirstOrCreate`, so we need to do a manual check
	// for existence beforehand
	if err := r.db.First(&user, "hashed_user_id = ?", hashedUserID).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			return err
		}
		if err := r.db.FirstOrCreate(&user, User{
			EncryptedUserSecret: encryptedUserSecret,
			HashedUserID:        hashedUserID,
		}).Error; err != nil {
			return err
		}
	}
	return nil
}
