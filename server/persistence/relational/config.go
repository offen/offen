// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateConfigValue(v *persistence.ConfigValue) error {
	local := importConfigValue(v)
	if err := r.db.Create(&local).Error; err != nil {
		return fmt.Errorf("relational: error creating config value: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindConfigValue(q interface{}) (*persistence.ConfigValue, error) {
	var value ConfigValue
	switch query := q.(type) {
	case persistence.FindConfigValueQueryByKey:
		if err := r.db.Where(
			"key = ?",
			string(query),
		).First(&value).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return value.export(), persistence.ErrUnknownSecret("relational: no matching config value found")
			}
			return value.export(), fmt.Errorf("relational: error looking up config value: %w", err)
		}
		return value.export(), nil
	default:
		return value.export(), persistence.ErrBadQuery
	}
}
