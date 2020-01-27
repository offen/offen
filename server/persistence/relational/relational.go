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
	m := gormigrate.New(r.db, gormigrate.DefaultOptions, []*gormigrate.Migration{})

	m.InitSchema(func(db *gorm.DB) error {
		return db.AutoMigrate(
			&Event{},
			&Account{},
			&Secret{},
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
		&Secret{},
		&AccountUser{},
		&AccountUserRelationship{},
		"migrations",
	).Error; err != nil {
		return fmt.Errorf("relational: error dropping tables: %w,", err)
	}
	return nil
}
