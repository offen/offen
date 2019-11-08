package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateUser(u *persistence.User) error {
	local := importUser(u)
	if err := r.db.Create(&local).Error; err != nil {
		return fmt.Errorf("persistence: error creating user: %w", err)
	}
	return nil
}

func (r *relationalDAL) DeleteUser(q interface{}) error {
	switch query := q.(type) {
	case persistence.DeleteUserQueryByHashedID:
		if err := r.db.Where("hashed_user_id = ?", string(query)).Delete(&User{}).Error; err != nil {
			return fmt.Errorf("persistence: error deleting user: %w", err)
		}
		return nil
	default:
		return persistence.ErrBadQuery
	}
}

func (r *relationalDAL) FindUser(q interface{}) (persistence.User, error) {
	var user User
	switch query := q.(type) {
	case persistence.FindUserQueryByHashedUserID:
		if err := r.db.Where(
			"hashed_user_id = ?",
			string(query),
		).First(&user).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return user.export(), persistence.ErrUnknownUser("persistence: no matching user found")
			}
			return user.export(), fmt.Errorf("persistence: error looking up user: %w", err)
		}
		return user.export(), nil
	default:
		return user.export(), persistence.ErrBadQuery
	}
}
