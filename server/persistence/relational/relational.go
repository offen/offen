// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
	"gorm.io/gorm"

	// GORM imports the dialects for side effects only
	_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

type relationalDAL struct {
	db *gorm.DB
}

// NewRelationalDAL wraps the given *gorm.DB, exposing the default
// interface for data access layers.
func NewRelationalDAL(db *gorm.DB) persistence.DataAccessLayer {
	return &relationalDAL{
		db: db,
	}
}

func (r *relationalDAL) Transaction() (persistence.Transaction, error) {
	txn := r.db.Begin()
	if err := txn.Error; err != nil {
		return nil, fmt.Errorf("relational: begun transaction in error state: %w", err)
	}
	dal := relationalDAL{txn}
	return &transaction{&dal}, nil
}

var knownTables = []interface{}{
	&Account{},
	&AccountUser{},
	&AccountUserRelationship{},
	&Event{},
	&Secret{},
	&Tombstone{},
}

func (r *relationalDAL) ProbeEmpty() bool {
	for _, table := range knownTables {
		var count int64
		if err := r.db.Model(table).Count(&count).Error; err != nil {
			return false
		}
		if count != 0 {
			return false
		}
	}
	return true
}

func (r *relationalDAL) Ping() error {
	db, err := r.db.DB()
	if err != nil {
		return fmt.Errorf("relational: error accessing underlying database connection: %w", err)
	}
	if err := db.Ping(); err != nil {
		return fmt.Errorf("relational: error pinging database: %w", err)
	}
	return err
}

func (r *relationalDAL) DropAll() error {
	if err := r.db.Migrator().DropTable(
		&Event{},
		&Account{},
		&Secret{},
		&AccountUser{},
		&AccountUserRelationship{},
		"migrations",
	); err != nil {
		return fmt.Errorf("relational: error dropping tables: %w,", err)
	}
	return nil
}
