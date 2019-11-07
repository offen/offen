package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateAccount(a *persistence.Account) error {
	if err := r.db.Create(a).Error; err != nil {
		return fmt.Errorf("persistence: error creating account")
	}
	return nil
}

func (r *relationalDAL) FindAccount(q interface{}) (persistence.Account, error) {
	var account persistence.Account
	switch query := q.(type) {
	case persistence.FindAccountQueryIncludeEvents:
		queryDB := r.db
		if query.Since != "" {
			queryDB = queryDB.Preload("Events", "event_id > ?", query.Since).Preload("Events.User")
		} else {
			queryDB = queryDB.Preload("Events").Preload("Events.User")
		}

		if err := queryDB.Find(&account, "account_id = ?", query.AccountID).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account, persistence.ErrUnknownAccount(fmt.Sprintf(`persistence: account id "%s" unknown`, query.AccountID))
			}
			return account, fmt.Errorf(`persistence: error looking up account with id %s: %w`, query.AccountID, err)
		}
		return account, nil
	case persistence.FindAccountQueryByID:
		if err := r.db.Where("account_id = ?", string(query)).First(&account).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account, persistence.ErrUnknownAccount("persistence: no matching account found")
			}
			return account, fmt.Errorf("persistence: error looking up account: %w", err)
		}
		return account, nil
	case persistence.FindAccountQueryActiveByID:
		if err := r.db.Where(
			"account_id = ? AND retired = ?",
			string(query),
			false,
		).First(&account).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account, persistence.ErrUnknownAccount("persistence: no matching active account found")
			}
			return account, fmt.Errorf("persistence: error looking up account: %w", err)
		}
		return account, nil
	default:
		return account, persistence.ErrBadQuery
	}
}

func (r *relationalDAL) FindAccounts(q interface{}) ([]persistence.Account, error) {
	var accounts []persistence.Account
	switch q.(type) {
	case persistence.FindAccountsQueryAllAccounts:
		if err := r.db.Find(&accounts).Error; err != nil {
			return accounts, fmt.Errorf("persistence: error looking up all accounts: %w", err)
		}
		return accounts, nil
	default:
		return accounts, persistence.ErrBadQuery
	}
}
