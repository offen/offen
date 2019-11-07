package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateUser(u *persistence.User) error {
	if err := r.db.Create(u).Error; err != nil {
		return fmt.Errorf("persistence: error creating user: %w", err)
	}
	return nil
}

func (r *relationalDAL) DeleteUser(q interface{}) error {
	switch query := q.(type) {
	case persistence.DeleteUserQueryByHashedID:
		if err := r.db.Where("hashed_user_id = ?", string(query)).Delete(&persistence.User{}).Error; err != nil {
			return fmt.Errorf("persistence: error deleting user: %w", err)
		}
		return nil
	default:
		return persistence.ErrBadQuery
	}
}

func (r *relationalDAL) FindUser(q interface{}) (persistence.User, error) {
	var user persistence.User
	switch query := q.(type) {
	case persistence.FindUserQueryByHashedUserID:
		if err := r.db.Where(
			"hashed_user_id = ?",
			string(query),
		).First(&user).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return user, persistence.ErrUnknownUser("persistence: no matching user found")
			}
			return user, fmt.Errorf("persistence: error looking up user: %w", err)
		}
		return user, nil
	default:
		return user, persistence.ErrBadQuery
	}
}
