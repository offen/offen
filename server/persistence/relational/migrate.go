package relational

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	gormigrate "gopkg.in/gormigrate.v1"
)

func Migrate(db *gorm.DB) error {
	m := gormigrate.New(db, gormigrate.DefaultOptions, []*gormigrate.Migration{})

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
