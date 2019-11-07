package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateAccountUserRelationship(a *persistence.AccountUserRelationship) error {
	if err := r.db.Create(a).Error; err != nil {
		return fmt.Errorf("persistence: error creating account user relationship: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindAccountUserRelationships(q interface{}) ([]persistence.AccountUserRelationship, error) {
	var relationships []persistence.AccountUserRelationship
	switch query := q.(type) {
	case persistence.FindAccountUserRelationShipsQueryByUserID:
		if err := r.db.Where("user_id = ?", string(query)).Find(&relationships).Error; err != nil {
			return relationships, fmt.Errorf("persistence: error looking up account to account user relationships: %w", err)
		}
		return relationships, nil
	default:
		return relationships, persistence.ErrBadQuery
	}
}

func (r *relationalDAL) UpdateAccountUserRelationship(a *persistence.AccountUserRelationship) error {
	if err := r.db.Save(a).Error; err != nil {
		return fmt.Errorf("persistence: error updating account user relationship: %w", err)
	}
	return nil
}
