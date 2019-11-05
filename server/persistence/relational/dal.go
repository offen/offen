package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) createEvent(e *Event) error {
	if err := r.db.Create(e).Error; err != nil {
		return fmt.Errorf("dal: error creating event: %w", err)
	}
	return nil
}

// FindUserQueryByHashedUserID requests the user of the given ID.
type FindUserQueryByHashedUserID string

// Query implements DatabaseQuery
func (f FindUserQueryByHashedUserID) Query() {}

func (r *relationalDatabase) findUser(query persistence.DatabaseQuery) (User, error) {
	switch q := query.(type) {
	case FindUserQueryByHashedUserID:
		var user User
		if err := r.db.Where("hashed_user_id = ?", string(q)).First(&user).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return user, persistence.ErrUnknownUser("dal: no matching user found")
			}
			return user, fmt.Errorf("dal: error looking up user: %w", err)
		}
		return user, nil
	default:
		return User{}, ErrBadQuery
	}
}

// FindAccountQueryActiveByID requests a non-retired account of the given ID.
type FindAccountQueryActiveByID string

// Query implements DatabaseQuery
func (f FindAccountQueryActiveByID) Query() {}

func (r *relationalDatabase) findAccount(q persistence.DatabaseQuery) (Account, error) {
	switch query := q.(type) {
	case FindAccountQueryActiveByID:
		var account Account
		if err := r.db.Where("account_id = ? AND retired = ?", string(query), false).First(&account).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account, persistence.ErrUnknownAccount("dal: no matching account found")
			}
			return account, fmt.Errorf("dal: error looking up account: %w", err)
		}
		return account, nil
	default:
		return Account{}, ErrBadQuery
	}
}
