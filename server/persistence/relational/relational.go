// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package relational

import (
	"fmt"
	"strings"
	"time"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"

	// GORM imports the dialects for side effects only
	_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	gormigrate "gopkg.in/gormigrate.v1"
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
	&Event{},
	&Account{},
	&Secret{},
	&AccountUser{},
	&AccountUserRelationship{},
}

func (r *relationalDAL) ProbeEmpty() bool {
	for _, table := range knownTables {
		var count int
		if err := r.db.Model(table).Count(&count).Error; err != nil {
			return false
		}
		if count != 0 {
			return false
		}
	}
	return true
}

func (r *relationalDAL) ApplyMigrations() error {
	m := gormigrate.New(r.db, gormigrate.DefaultOptions, []*gormigrate.Migration{
		{
			ID: "001_introduce_admin_level",
			Migrate: func(db *gorm.DB) error {
				type AccountUser struct {
					AccountUserID  string `gorm:"primary_key"`
					HashedEmail    string
					HashedPassword string
					Salt           string
					AdminLevel     int
					Relationships  []AccountUserRelationship `gorm:"foreignkey:AccountUserID;association_foreignkey:AccountUserID"`
				}
				if err := db.AutoMigrate(&AccountUser{}).Error; err != nil {
					return err
				}
				return db.Model(&AccountUser{}).UpdateColumn("admin_level", 1).Error
			},
			Rollback: func(db *gorm.DB) error {
				type AccountUser struct {
					AccountUserID  string `gorm:"primary_key"`
					HashedEmail    string
					HashedPassword string
					Salt           string
					Relationships  []AccountUserRelationship `gorm:"foreignkey:AccountUserID;association_foreignkey:AccountUserID"`
				}
				return db.AutoMigrate(&AccountUser{}).Error
			},
		},
		{
			ID: "002_mysql_set_column_sizes",
			Migrate: func(db *gorm.DB) error {
				type Account struct {
					AccountID           string `gorm:"primary_key"`
					Name                string
					PublicKey           string `gorm:"type:text"`
					EncryptedPrivateKey string `gorm:"type:text"`
					UserSalt            string
					Retired             bool
					Created             time.Time
					Events              []Event `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
				}
				type AccountUserRelationship struct {
					RelationshipID                    string `gorm:"primary_key"`
					AccountUserID                     string
					AccountID                         string
					PasswordEncryptedKeyEncryptionKey string `gorm:"type:text"`
					EmailEncryptedKeyEncryptionKey    string `gorm:"type:text"`
					OneTimeEncryptedKeyEncryptionKey  string `gorm:"type:text"`
				}
				type Event struct {
					EventID   string `gorm:"primary_key"`
					AccountID string
					// the secret id is nullable for anonymous events
					SecretID *string
					Payload  string `gorm:"type:text"`
					Secret   Secret `gorm:"foreignkey:SecretID;association_foreignkey:SecretID"`
				}

				return db.AutoMigrate(&Account{}, &AccountUserRelationship{}, &Event{}).Error
			},
			Rollback: func(db *gorm.DB) error {
				type Account struct {
					AccountID           string `gorm:"primary_key"`
					Name                string
					PublicKey           string
					EncryptedPrivateKey string
					UserSalt            string
					Retired             bool
					Created             time.Time
					Events              []Event `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
				}
				type AccountUserRelationship struct {
					RelationshipID                    string `gorm:"primary_key"`
					AccountUserID                     string
					AccountID                         string
					PasswordEncryptedKeyEncryptionKey string
					EmailEncryptedKeyEncryptionKey    string
					OneTimeEncryptedKeyEncryptionKey  string
				}
				type Event struct {
					EventID   string `gorm:"primary_key"`
					AccountID string
					// the secret id is nullable for anonymous events
					SecretID *string
					Payload  string
					Secret   Secret `gorm:"foreignkey:SecretID;association_foreignkey:SecretID"`
				}
				return db.AutoMigrate(&Account{}, &AccountUserRelationship{}, &Event{}).Error
			},
		},
		{
			ID: "003_account_user_salt_version",
			Migrate: func(db *gorm.DB) error {
				type AccountUser struct {
					AccountUserID  string `gorm:"primary_key"`
					HashedEmail    string
					HashedPassword string
					Salt           string
					AdminLevel     int
					Relationships  []AccountUserRelationship `gorm:"foreignkey:AccountUserID;association_foreignkey:AccountUserID"`
				}
				var allUsers []*AccountUser
				if err := db.Find(&allUsers).Error; err != nil {
					return err
				}
				txn := db.Begin()
				for _, user := range allUsers {
					user.Salt = fmt.Sprintf("{1,} %s", user.Salt)
					if err := txn.Save(user).Error; err != nil {
						txn.Rollback()
						return err
					}
				}
				return txn.Commit().Error
			},
			Rollback: func(db *gorm.DB) error {
				type AccountUser struct {
					AccountUserID  string `gorm:"primary_key"`
					HashedEmail    string
					HashedPassword string
					Salt           string
					AdminLevel     int
					Relationships  []AccountUserRelationship `gorm:"foreignkey:AccountUserID;association_foreignkey:AccountUserID"`
				}
				var allUsers []*AccountUser
				if err := db.Find(&allUsers).Error; err != nil {
					return err
				}
				txn := db.Begin()
				for _, user := range allUsers {
					chunks := strings.Split(user.Salt, " ")
					user.Salt = chunks[1]
					if err := txn.Save(user).Error; err != nil {
						txn.Rollback()
						return err
					}
				}
				return txn.Commit().Error
			},
		},
	})

	m.InitSchema(func(db *gorm.DB) error {
		return db.AutoMigrate(knownTables...).Error
	})

	return m.Migrate()
}

func (r *relationalDAL) Ping() error {
	return r.db.DB().Ping()
}

func (r *relationalDAL) DropAll() error {
	if err := r.db.DropTableIfExists(
		&Event{},
		&Account{},
		&Secret{},
		&AccountUser{},
		&AccountUserRelationship{},
		"migrations",
	).Error; err != nil {
		return fmt.Errorf("relational: error dropping tables: %w,", err)
	}
	return nil
}
