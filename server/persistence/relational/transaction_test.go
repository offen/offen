package relational

import (
	"testing"

	"github.com/jinzhu/gorm"

	"github.com/offen/offen/server/persistence"
)

func TestRelationalDAL_Transaction(t *testing.T) {
	db, closeDB := createTestDatabase()
	defer closeDB()

	dal := NewRelationalDAL(db)

	txn, err := dal.Transaction()
	if err != nil {
		t.Errorf("Unexpected error creating transaction %v", err)
	}

	if _, err := txn.Transaction(); err == nil {
		t.Error("Expected error when creating transaction off another transaction")
	}

	if err := txn.Ping(); err == nil {
		t.Error("Expected error when using transaction to ping")
	}

	if err := txn.ApplyMigrations(); err == nil {
		t.Errorf("Expected error when applying migrations to a transaction")
	}

	if err := txn.CreateEvent(&persistence.Event{
		EventID: "event-a",
		Payload: "payload-xxx",
	}); err != nil {
		t.Fatalf("Unexpected error inserting data: %v", err)
	}

	if err := txn.Commit(); err != nil {
		t.Errorf("Unexpected error committing transaction: %v", err)
	}

	if err := db.Where("event_id = ?", "event-a").First(&Event{}).Error; err != nil {
		t.Errorf("Unexpected error value looking up record post-commit: %v", err)
	}

	txn2, err := dal.Transaction()
	if err != nil {
		t.Fatalf("Unexpected error creating transaction: %v", txn2)
	}
	if err := txn2.CreateEvent(&persistence.Event{
		EventID: "event-b",
		Payload: "payload-yyy",
	}); err != nil {
		t.Fatalf("Unexpected error inserting data: %v", err)
	}

	if err := txn2.Rollback(); err != nil {
		t.Errorf("Unexpected error rolling back transaction: %v", err)
	}

	if err := db.Where("event_id = ?", "event-b").First(&Event{}).Error; !gorm.IsRecordNotFoundError(err) {
		t.Errorf("Unexpected error value looking up record post-rollback: %v", err)
	}
}
