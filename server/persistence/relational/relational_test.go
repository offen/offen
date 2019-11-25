package relational

import (
	"testing"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

func createTestDatabase() (*gorm.DB, func() error) {
	db, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		panic(err)
	}
	if err := db.AutoMigrate(&Event{}, &Account{}, &User{}, &AccountUser{}, &AccountUserRelationship{}).Error; err != nil {
		panic(err)
	}
	return db, db.Close
}

type dbAccess func(*gorm.DB) error

var noop dbAccess = func(*gorm.DB) error { return nil }

func strptr(s string) *string { return &s }

func TestRelationalDAL_Ping(t *testing.T) {
	db, closeDB := createTestDatabase()
	defer closeDB()

	dal := NewRelationalDAL(db)
	if err := dal.Ping(); err != nil {
		t.Errorf("Unexpected error pinging database: %v", err)
	}
}

func TestRelationalDAL_DropAll(t *testing.T) {
	db, closeDB := createTestDatabase()
	defer closeDB()

	if err := db.Save(&Event{
		EventID: "event-id",
		Payload: "payload",
	}).Error; err != nil {
		t.Fatalf("Unexpected error setting up test: %v", err)
	}

	dal := NewRelationalDAL(db)
	if err := dal.DropAll(); err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	err := db.Where("event_id = ?", "event-id").First(&Event{}).Error
	if !gorm.IsRecordNotFoundError(err) {
		t.Errorf("Unexpected error value %v", err)
	}
}

func TestRelationalDAL_ApplyMigrations(t *testing.T) {
	db, closeDB := createTestDatabase()
	defer closeDB()

	dal := NewRelationalDAL(db)

	if err := dal.ApplyMigrations(); err != nil {
		t.Errorf("Unexpected error: %v", err)
	}
}
