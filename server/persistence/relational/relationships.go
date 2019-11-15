package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateAccountUserRelationship(a *persistence.AccountUserRelationship) error {
	local := importAccountUserRelationship(a)
	if err := r.db.Create(&local).Error; err != nil {
		return fmt.Errorf("relational: error creating account user relationship: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindAccountUserRelationships(q interface{}) ([]persistence.AccountUserRelationship, error) {
	var relationships []AccountUserRelationship
	switch query := q.(type) {
	case persistence.FindAccountUserRelationShipsQueryByUserID:
		if err := r.db.Where("user_id = ?", string(query)).Find(&relationships).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up account to account user relationships: %w", err)
		}
		result := []persistence.AccountUserRelationship{}
		for _, r := range relationships {
			result = append(result, r.export())
		}
		return result, nil
	default:
		return nil, persistence.ErrBadQuery
	}
}

func (r *relationalDAL) UpdateAccountUserRelationship(a *persistence.AccountUserRelationship) error {
	local := importAccountUserRelationship(a)
	exists := r.db.Where("relationship_id = ?", local.RelationshipID).First(&AccountUserRelationship{}).Error
	if exists != nil {
		return fmt.Errorf("relational: error looking up relationship to update: %w", exists)
	}
	if err := r.db.Save(&local).Error; err != nil {
		return fmt.Errorf("relational: error updating account user relationship: %w", err)
	}
	return nil
}
