// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package relational

import (
	"fmt"
	"strings"
	"time"

	gormigrate "github.com/go-gormigrate/gormigrate/v2"
	"github.com/offen/offen/server/persistence"
	"gorm.io/gorm"
)

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
				if err := db.AutoMigrate(&AccountUser{}); err != nil {
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
				return db.AutoMigrate(&AccountUser{})
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

				return db.AutoMigrate(&Account{}, &AccountUserRelationship{}, &Event{})
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
				return db.AutoMigrate(&Account{}, &AccountUserRelationship{}, &Event{})
			},
		},
		{
			ID: "003_version_salts",
			Migrate: func(db *gorm.DB) error {
				type AccountUser struct {
					AccountUserID  string `gorm:"primary_key"`
					HashedEmail    string
					HashedPassword string
					Salt           string
					AdminLevel     int
					Relationships  []AccountUserRelationship `gorm:"foreignkey:AccountUserID;association_foreignkey:AccountUserID"`
				}
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

				var allUsers []*AccountUser
				if err := db.Find(&allUsers).Error; err != nil {
					return err
				}
				var allAccounts []*Account
				if err := db.Find(&allAccounts).Error; err != nil {
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

				for _, account := range allAccounts {
					account.UserSalt = fmt.Sprintf("{1,} %s", account.UserSalt)
					if err := txn.Save(account).Error; err != nil {
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

				var allUsers []*AccountUser
				if err := db.Find(&allUsers).Error; err != nil {
					return err
				}
				var allAccounts []*Account
				if err := db.Find(&allAccounts).Error; err != nil {
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
				for _, account := range allAccounts {
					chunks := strings.Split(account.UserSalt, " ")
					account.UserSalt = chunks[1]
					if err := txn.Save(account).Error; err != nil {
						txn.Rollback()
						return err
					}
				}

				return txn.Commit().Error
			},
		},
		{
			ID: "004_add_tombstones_event_revs",
			Migrate: func(db *gorm.DB) error {
				type Tombstone struct {
					EventID   string `gorm:"primary_key"`
					AccountID string
					SecretID  string
					Sequence  string
				}

				type Event struct {
					EventID   string `gorm:"primary_key"`
					Sequence  string
					AccountID string
					SecretID  *string
					Payload   string `gorm:"type:text"`
					Secret    Secret `gorm:"foreignkey:SecretID;association_foreignkey:SecretID"`
				}

				if err := db.AutoMigrate(&Tombstone{}, &Event{}); err != nil {
					return err
				}

				seq, err := persistence.NewULID()
				if err != nil {
					return err
				}

				if err := db.Table("events").Update("sequence", seq).Error; err != nil {
					return err
				}
				return nil
			},
			Rollback: func(db *gorm.DB) error {
				// we cannot drop the sequence column on the events table
				// because this is not supported by SQLite
				return db.Migrator().DropTable("tombstones")
			},
		},
		{
			ID: "005_update_secrets_table",
			Migrate: func(db *gorm.DB) error {
				type Secret struct {
					SecretID        string `gorm:"primary_key"`
					EncryptedSecret string `gorm:"type:text"`
				}
				if db.Config.Dialector.Name() == "mysql" {
					return db.Exec("ALTER TABLE secrets MODIFY COLUMN encrypted_secret TEXT").Error
				}
				return nil
			},
			Rollback: func(db *gorm.DB) error {
				type Secret struct {
					SecretID        string `gorm:"primary_key"`
					EncryptedSecret string
				}
				if db.Config.Dialector.Name() == "mysql" {
					return db.Exec("ALTER TABLE secrets MODIFY COLUMN encrypted_secret VARCHAR").Error
				}
				return nil
			},
		},
		{
			ID: "006_gorm_upgrade",
			Migrate: func(db *gorm.DB) error {
				type Event struct {
					EventID   string  `gorm:"primary_key;size:26;unique"`
					Sequence  string  `gorm:"size:26"`
					AccountID string  `gorm:"size:36"`
					SecretID  *string `gorm:"size:64"`
					Payload   string  `gorm:"type:text"`
					Secret    Secret  `gorm:"foreignkey:SecretID;association_foreignkey:SecretID"`
				}

				type Tombstone struct {
					EventID   string  `gorm:"primary_key"`
					AccountID string  `gorm:"size:36"`
					SecretID  *string `gorm:"size:64"`
					Sequence  string  `gorm:"size:26"`
				}
				type Secret struct {
					SecretID        string `gorm:"primary_key;size:64;unique"`
					EncryptedSecret string `gorm:"type:text"`
				}
				type Account struct {
					AccountID           string `gorm:"primary_key;size:36;unique"`
					Name                string
					PublicKey           string `gorm:"type:text"`
					EncryptedPrivateKey string `gorm:"type:text"`
					UserSalt            string
					Retired             bool
					Created             time.Time
					Events              []Event `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
				}
				type AccountUser struct {
					AccountUserID  string `gorm:"primary_key;size:36;unique"`
					HashedEmail    string
					HashedPassword string
					Salt           string
					AdminLevel     int
					Relationships  []AccountUserRelationship `gorm:"foreignkey:AccountUserID;association_foreignkey:AccountUserID"`
				}
				type AccountUserRelationship struct {
					RelationshipID                    string `gorm:"primary_key;size:36;unique"`
					AccountUserID                     string `gorm:"size:36"`
					AccountID                         string `gorm:"size:36"`
					PasswordEncryptedKeyEncryptionKey string `gorm:"type:text"`
					EmailEncryptedKeyEncryptionKey    string `gorm:"type:text"`
					OneTimeEncryptedKeyEncryptionKey  string `gorm:"type:text"`
				}
				return db.AutoMigrate(
					&Account{},
					&AccountUser{},
					&AccountUserRelationship{},
					&Event{},
					&Secret{},
					&Tombstone{},
				)
			},
			Rollback: func(db *gorm.DB) error {
				// this change cannot be rolled back considering the upgraded GORM version
				// is not accepting the previously defined schemas
				return nil
			},
		},
		{
			ID: "007_account_customStyles",
			Migrate: func(db *gorm.DB) error {
				type Account struct {
					AccountID           string `gorm:"primary_key;size:36;unique"`
					Name                string
					PublicKey           string `gorm:"type:text"`
					EncryptedPrivateKey string `gorm:"type:text"`
					UserSalt            string
					Retired             bool
					CustomStyles        string `gorm:"type:text"`
					Created             time.Time
					Events              []Event `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
				}
				return db.AutoMigrate(&Account{})
			},
			Rollback: func(db *gorm.DB) error {
				return db.Migrator().DropColumn("accounts", "custom_styles")
			},
		},
	})

	m.InitSchema(func(db *gorm.DB) error {
		return db.AutoMigrate(knownTables...)
	})

	return m.Migrate()
}
