package relational

import (
	"github.com/jinzhu/gorm"
	gormigrate "gopkg.in/gormigrate.v1"
)

// Migrate runs the defined database migrations in the given db or initializes it
// from the latest definition if it is still blank.
func (r *relationalDatabase) Migrate() error {
	m := gormigrate.New(r.db, gormigrate.DefaultOptions, []*gormigrate.Migration{
		{
			ID: "001_add_one_time_keys",
			Migrate: func(db *gorm.DB) error {
				type AccountUserRelationship struct {
					RelationshipID                    string `gorm:"primary_key"`
					UserID                            string
					AccountID                         string
					PasswordEncryptedKeyEncryptionKey string
					EmailEncryptedKeyEncryptionKey    string
					// this is the field introducted in this migration
					OneTimeEncryptedKeyEncryptionKey string
				}
				return db.AutoMigrate(&AccountUserRelationship{}).Error
			},
			Rollback: func(db *gorm.DB) error {
				return db.Table("account_user_relationships").DropColumn("one_time_encrypted_key_encryption_key").Error
			},
		},
	})

	m.InitSchema(func(tx *gorm.DB) error {
		return tx.AutoMigrate(
			&Event{},
			&Account{},
			&User{},
			&AccountUser{},
			&AccountUserRelationship{},
		).Error
	})

	return m.Migrate()
}
