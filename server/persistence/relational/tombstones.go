// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateTombstone(t *persistence.Tombstone) error {
	local := importTombstone(t)
	if err := r.db.Create(&local).Error; err != nil {
		return fmt.Errorf("relational: error creating tombstone: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindTombstones(q interface{}) ([]persistence.Tombstone, error) {
	switch query := q.(type) {
	case persistence.FindTombstonesQueryByAccounts:
		var result []Tombstone
		if err := r.db.Find(&result, "account_id IN (?) AND sequence > ?", query.AccountIDs, query.Since).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up tombstones by account ids: %w", err)
		}
		var export []persistence.Tombstone
		for _, t := range result {
			export = append(export, t.export())
		}
		return export, nil
	case persistence.FindTombstonesQueryBySecrets:
		var result []Tombstone
		if err := r.db.Find(&result, "secret_id IN (?) AND sequence > ?", query.SecretIDs, query.Since).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up tombstones by secret ids: %w", err)
		}
		var export []persistence.Tombstone
		for _, t := range result {
			export = append(export, t.export())
		}
		return export, nil
	default:
		return nil, persistence.ErrBadQuery
	}
}
