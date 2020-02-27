package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateAccount(a *persistence.Account) error {
	local := importAccount(a)
	if err := r.db.Create(&local).Error; err != nil {
		return fmt.Errorf("relational: error creating account: %w", err)
	}
	return nil
}

func (r *relationalDAL) UpdateAccount(a *persistence.Account) error {
	local := importAccount(a)
	if err := r.db.Save(&local).Error; err != nil {
		return fmt.Errorf("relational: error saving account: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindAccount(q interface{}) (persistence.Account, error) {
	var account Account
	switch query := q.(type) {
	case persistence.FindAccountQueryIncludeEvents:
		queryDB := r.db
		if query.Since != "" {
			queryDB = queryDB.Preload("Events", "event_id > ?", query.Since).Preload("Events.Secret")
		} else {
			queryDB = queryDB.Preload("Events").Preload("Events.Secret")
		}

		if err := queryDB.Find(&account, "account_id = ?", query.AccountID).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account.export(), persistence.ErrUnknownAccount(fmt.Sprintf(`relational: account id "%s" unknown`, query.AccountID))
			}
			return account.export(), fmt.Errorf(`relational: error looking up account with id %s: %w`, query.AccountID, err)
		}
		return account.export(), nil
	case persistence.FindAccountQueryByID:
		if err := r.db.Where("account_id = ?", string(query)).First(&account).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account.export(), persistence.ErrUnknownAccount("relational: no matching account found")
			}
			return account.export(), fmt.Errorf("relational: error looking up account: %w", err)
		}
		return account.export(), nil
	case persistence.FindAccountQueryActiveByID:
		if err := r.db.Where(
			"account_id = ? AND retired = ?",
			string(query),
			false,
		).First(&account).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account.export(), persistence.ErrUnknownAccount("relational: no matching active account found")
			}
			return account.export(), fmt.Errorf("relational: error looking up account: %w", err)
		}
		return account.export(), nil
	default:
		return account.export(), persistence.ErrBadQuery
	}
}

func (r *relationalDAL) FindAccounts(q interface{}) ([]persistence.Account, error) {
	var accounts []Account
	switch q.(type) {
	case persistence.FindAccountsQueryAllAccounts:
		if err := r.db.Find(&accounts).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up all accounts: %w", err)
		}
		result := []persistence.Account{}
		for _, a := range accounts {
			result = append(result, a.export())
		}
		return result, nil
	default:
		return nil, persistence.ErrBadQuery
	}
}
