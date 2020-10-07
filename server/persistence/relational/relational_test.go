// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package relational

import (
	"errors"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func createTestDatabase() (*gorm.DB, func() error) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		panic(err)
	}
	if err := db.AutoMigrate(&Event{}, &Account{}, &Secret{}, &AccountUser{}, &AccountUserRelationship{}, &Tombstone{}); err != nil {
		panic(err)
	}
	d, _ := db.DB()
	return db, d.Close
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

	if err := dal.ApplyMigrations(); err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	err := db.Where("event_id = ?", "event-id").First(&Event{}).Error
	if !errors.Is(err, gorm.ErrRecordNotFound) {
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
