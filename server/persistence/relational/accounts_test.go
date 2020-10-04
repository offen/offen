// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package relational

import (
	"errors"
	"fmt"
	"reflect"
	"testing"

	"gorm.io/gorm"
	"github.com/offen/offen/server/persistence"
)

func TestRelationalDAL_CreateAccount(t *testing.T) {
	tests := []struct {
		name        string
		arg         *persistence.Account
		expectError bool
		assertion   dbAccess
	}{
		{
			"ok",
			&persistence.Account{
				Name:      "account-name",
				AccountID: "account-id",
			},
			false,
			func(db *gorm.DB) error {
				if err := db.Where("account_id = ?", "account-id").First(&Account{}).Error; err != nil {
					return fmt.Errorf("error looking up inserted record: %v", err)
				}
				return nil
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()
			dal := NewRelationalDAL(db)

			err := dal.CreateAccount(test.arg)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Assertion error when validating database content: %v", err)
			}
		})
	}
}

func TestRelationalDAL_UpdateAccount(t *testing.T) {
	tests := []struct {
		name        string
		setup       dbAccess
		arg         *persistence.Account
		expectError bool
		assertion   dbAccess
	}{
		{
			"ok",
			func(db *gorm.DB) error {
				if err := db.Create(&Account{
					AccountID: "account-a",
				}).Error; err != nil {
					return err
				}
				if err := db.Create(&Account{
					AccountID: "account-b",
				}).Error; err != nil {
					return err
				}
				return nil
			},
			&persistence.Account{
				AccountID: "account-a",
				Retired:   true,
			},
			false,
			func(db *gorm.DB) error {
				{

					var account Account
					if err := db.Find(&account, "account_id = ?", "account-a").Error; err != nil {
						return err
					}
					if account.Retired != true {
						return errors.New("expected account to update")
					}
				}
				{
					var account Account
					if err := db.Find(&account, "account_id = ?", "account-b").Error; err != nil {
						return err
					}
					if account.Retired != false {
						return errors.New("unexpected side effect when updating")
					}

				}
				return nil
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()
			dal := NewRelationalDAL(db)

			if err := test.setup(db); err != nil {
				t.Fatalf("Error setting up test: %v", err)
			}

			err := dal.UpdateAccount(test.arg)

			if test.expectError != (err != nil) {
				t.Errorf("Unexpected error value: %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Unexpected assertion error: %v", err)
			}
		})
	}
}

func TestRelationalDAL_FindAccount(t *testing.T) {
	tests := []struct {
		name           string
		setup          dbAccess
		arg            interface{}
		expectedResult persistence.Account
		expectError    bool
	}{
		{
			"bad query",
			noop,
			func() string { return "hey" },
			persistence.Account{},
			true,
		},
		{
			"active by id found",
			func(db *gorm.DB) error {
				if err := db.Save(&Account{
					AccountID: "account-a",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				if err := db.Save(&Account{
					AccountID: "account-z",
					Retired:   true,
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				return nil
			},
			persistence.FindAccountQueryActiveByID("account-a"),
			persistence.Account{
				AccountID: "account-a",
			},
			false,
		},
		{
			"active by id not found",
			func(db *gorm.DB) error {
				if err := db.Save(&Account{
					AccountID: "account-a",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				if err := db.Save(&Account{
					AccountID: "account-z",
					Retired:   true,
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				return nil
			},
			persistence.FindAccountQueryActiveByID("account-z"),
			persistence.Account{},
			true,
		},
		{
			"by id found",
			func(db *gorm.DB) error {
				if err := db.Save(&Account{
					AccountID: "account-a",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				if err := db.Save(&Account{
					AccountID: "account-z",
					Retired:   true,
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				return nil
			},
			persistence.FindAccountQueryByID("account-z"),
			persistence.Account{
				AccountID: "account-z",
				Retired:   true,
			},
			false,
		},
		{
			"by id not found",
			func(db *gorm.DB) error {
				if err := db.Save(&Account{
					AccountID: "account-a",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				if err := db.Save(&Account{
					AccountID: "account-z",
					Retired:   true,
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				return nil
			},
			persistence.FindAccountQueryByID("account-x"),
			persistence.Account{},
			true,
		},
		{
			"include events",
			func(db *gorm.DB) error {
				if err := db.Save(&Account{
					AccountID: "account-id",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				if err := db.Save(&Event{
					EventID:   "event-id",
					Payload:   "payload",
					AccountID: "account-id",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				if err := db.Save(&Event{
					EventID:   "other-event-id",
					Payload:   "other-payload",
					AccountID: "other-account-id",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				return nil
			},
			persistence.FindAccountQueryIncludeEvents{
				AccountID: "account-id",
			},
			persistence.Account{
				AccountID: "account-id",
				Events: []persistence.Event{
					{EventID: "event-id", Payload: "payload", AccountID: "account-id"},
				},
			},
			false,
		},
		{
			"include events unknown account",
			func(db *gorm.DB) error {
				if err := db.Save(&Account{
					AccountID: "account-id",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				return nil
			},
			persistence.FindAccountQueryIncludeEvents{
				AccountID: "other-account-id",
			},
			persistence.Account{},
			true,
		},
		{
			"include events since",
			func(db *gorm.DB) error {
				if err := db.Save(&Account{
					AccountID: "account-id",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				if err := db.Save(&Event{
					EventID:   "event-id-a",
					Payload:   "payload",
					AccountID: "account-id",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				if err := db.Save(&Event{
					EventID:   "event-id-b",
					Payload:   "other-payload",
					AccountID: "account-id",
				}).Error; err != nil {
					return fmt.Errorf("error inserting fixture: %v", err)
				}
				return nil
			},
			persistence.FindAccountQueryIncludeEvents{
				AccountID: "account-id",
				Since:     "event-id-a",
			},
			persistence.Account{
				AccountID: "account-id",
				Events: []persistence.Event{
					{EventID: "event-id-b", Payload: "other-payload", AccountID: "account-id"},
				},
			},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()
			dal := NewRelationalDAL(db)

			if err := test.setup(db); err != nil {
				t.Fatalf("Error setting up test: %v", err)
			}

			result, err := dal.FindAccount(test.arg)

			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}

func TestRelationalDAL_FindAccounts(t *testing.T) {
	tests := []struct {
		name           string
		setup          dbAccess
		arg            interface{}
		expectedResult []persistence.Account
		expectError    bool
	}{
		{
			"bad arg",
			noop,
			nil,
			nil,
			true,
		},
		{
			"all accounts",
			func(db *gorm.DB) error {
				for _, token := range []string{"a", "b", "c"} {
					if err := db.Save(&Account{
						AccountID: fmt.Sprintf("account-id-%s", token),
						Name:      fmt.Sprintf("account-name-%s", token),
					}).Error; err != nil {
						return fmt.Errorf("error creating test fixture: %v", err)
					}
				}
				return nil
			},
			persistence.FindAccountsQueryAllAccounts{},
			[]persistence.Account{
				{AccountID: "account-id-a", Name: "account-name-a"},
				{AccountID: "account-id-b", Name: "account-name-b"},
				{AccountID: "account-id-c", Name: "account-name-c"},
			},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, closeDB := createTestDatabase()
			defer closeDB()
			dal := NewRelationalDAL(db)

			if err := test.setup(db); err != nil {
				t.Fatalf("Error setting up test: %v", err)
			}

			result, err := dal.FindAccounts(test.arg)

			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}
