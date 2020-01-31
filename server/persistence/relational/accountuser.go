package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateAccountUser(u *persistence.AccountUser) error {
	local := importAccountUser(u)
	if err := r.db.Create(&local).Error; err != nil {
		return fmt.Errorf("relational: error creating account user: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindAccountUser(q interface{}) (persistence.AccountUser, error) {
	var accountUser AccountUser
	switch query := q.(type) {
	case persistence.FindAccountUserQueryByAccountUserIDIncludeRelationships:
		if err := r.db.Preload("Relationships").Where("account_user_id = ?", string(query)).First(&accountUser).Error; err != nil {
			return accountUser.export(), fmt.Errorf("relational: error looking up account user by user id: %w", err)
		}
		return accountUser.export(), nil
	default:
		return accountUser.export(), persistence.ErrBadQuery
	}
}

func (r *relationalDAL) UpdateAccountUser(u *persistence.AccountUser) error {
	local := importAccountUser(u)
	exists := r.db.Where("account_user_id = ?", local.AccountUserID).First(&AccountUser{}).Error
	if exists != nil {
		return fmt.Errorf("relational: error looking up account user for update: %w", exists)
	}
	if err := r.db.Save(&local).Error; err != nil {
		return fmt.Errorf("relational: error updating account user: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindAccountUsers(q interface{}) ([]persistence.AccountUser, error) {
	var accountUsers []AccountUser
	switch query := q.(type) {
	case persistence.FindAccountUsersQueryAllAccountUsers:
		db := r.db
		if query.IncludeRelationships {
			db = db.Preload("Relationships")
		}
		if err := db.Find(&accountUsers).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up account users: %w", err)
		}
		var result []persistence.AccountUser
		for _, accountUser := range accountUsers {
			result = append(result, accountUser.export())
		}
		return result, nil
	default:
		return nil, persistence.ErrBadQuery
	}
}
