package relational

import (
	"fmt"

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

func (r *relationalDAL) ApplyMigrations() error {
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

	m.InitSchema(func(db *gorm.DB) error {
		return db.AutoMigrate(
			&Event{},
			&Account{},
			&User{},
			&AccountUser{},
			&AccountUserRelationship{},
		).Error
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
		&User{},
		&AccountUser{},
		&AccountUserRelationship{},
		"migrations",
	).Error; err != nil {
		return fmt.Errorf("relational: error dropping tables: %w,", err)
	}
	return nil
}
