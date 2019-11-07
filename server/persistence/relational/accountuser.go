package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateAccountUser(u *persistence.AccountUser) error {
	if err := r.db.Create(u).Error; err != nil {
		return fmt.Errorf("persistence: error creating account user: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindAccountUser(q interface{}) (persistence.AccountUser, error) {
	var accountUser persistence.AccountUser
	switch query := q.(type) {
	case persistence.FindAccountUserQueryByHashedEmail:
		if err := r.db.Where("hashed_email = ?", string(query)).First(&accountUser).Error; err != nil {
			return accountUser, fmt.Errorf("persistence: error looking up account user by hashed email: %w", err)
		}
		return accountUser, nil
	case persistence.FindAccountUserQueryByHashedEmailIncludeRelationships:
		var accountUser persistence.AccountUser
		if err := r.db.Preload("Relationships").Where("hashed_email = ?", string(query)).First(&accountUser).Error; err != nil {
			return accountUser, fmt.Errorf("persistence: error looking up account user by hashed email: %w", err)
		}
		return accountUser, nil
	case persistence.FindAccountUserQueryByUserIDIncludeRelationships:
		var accountUser persistence.AccountUser
		if err := r.db.Preload("Relationships").Where("user_id = ?", string(query)).First(&accountUser).Error; err != nil {
			return accountUser, fmt.Errorf("persistence: error looking up account user by user id: %w", err)
		}
		return accountUser, nil
	default:
		return accountUser, persistence.ErrBadQuery
	}
}

func (r *relationalDAL) UpdateAccountUser(u *persistence.AccountUser) error {
	if err := r.db.Save(u).Error; err != nil {
		return fmt.Errorf("persistence: error updating account user: %w", err)
	}
	return nil
}
