package relational

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

func createTestDatabase() (*gorm.DB, func() error) {
	db, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		panic(err)
	}
	if err := db.AutoMigrate(&Event{}, &Account{}, &User{}).Error; err != nil {
		panic(err)
	}
	return db, db.Close
}

type dbaccess func(*gorm.DB) error

var noop dbaccess = func(*gorm.DB) error { return nil }
