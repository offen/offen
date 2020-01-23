package relational

import (
	"fmt"
	"reflect"
	"testing"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func TestRelationalDAL_CreateEvent(t *testing.T) {
	tests := []struct {
		name        string
		arg         *persistence.Event
		expectError bool
		assertion   dbAccess
	}{
		{
			"ok",
			&persistence.Event{
				EventID: "event-id",
				Payload: "payload",
			},
			false,
			func(db *gorm.DB) error {
				err := db.Where("event_id = ?", "event-id").First(&Event{}).Error
				if err != nil {
					return fmt.Errorf("error looking up event: %w", err)
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
			err := dal.CreateEvent(test.arg)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Assertion error validating database content: %v", err)
			}
		})
	}
}

func TestRelationalDAL_FindEvents(t *testing.T) {
	tests := []struct {
		name           string
		setup          dbAccess
		query          interface{}
		expectedResult []persistence.Event
		expectError    bool
	}{
		{
			"bad query",
			noop,
			'z',
			nil,
			true,
		},
		{
			"by event ids",
			func(db *gorm.DB) error {
				for _, token := range []string{"a", "b", "c"} {
					if err := db.Save(&Event{
						EventID: fmt.Sprintf("event-%s", token),
						Payload: fmt.Sprintf("payload-%s", token),
					}).Error; err != nil {
						return fmt.Errorf("error saving fixture data: %v", err)
					}
				}
				return nil
			},
			persistence.FindEventsQueryByEventIDs{"event-a", "event-b", "event-z"},
			[]persistence.Event{
				{EventID: "event-a", Payload: "payload-a"},
				{EventID: "event-b", Payload: "payload-b"},
			},
			false,
		},
		{
			"by secret id - all events",
			func(db *gorm.DB) error {
				for _, token := range []string{"a", "b", "c"} {
					if err := db.Save(&Event{
						EventID:  fmt.Sprintf("event-%s", token),
						SecretID: strptr(fmt.Sprintf("hashed-user-id-%s", token)),
					}).Error; err != nil {
						return fmt.Errorf("error saving fixture data: %v", err)
					}
				}
				return nil
			},
			persistence.FindEventsQueryForSecretIDs{
				SecretIDs: []string{"hashed-user-id-a", "hashed-user-id-b", "hashed-user-id-z"},
			},
			[]persistence.Event{
				{EventID: "event-a", SecretID: strptr("hashed-user-id-a")},
				{EventID: "event-b", SecretID: strptr("hashed-user-id-b")},
			},
			false,
		},
		{
			"by secret id - using since param",
			func(db *gorm.DB) error {
				for _, token := range []string{"a", "b", "c"} {
					if err := db.Save(&Event{
						EventID:  fmt.Sprintf("event-%s", token),
						SecretID: strptr(fmt.Sprintf("hashed-user-id-%s", token)),
					}).Error; err != nil {
						return fmt.Errorf("error saving fixture data: %v", err)
					}
				}
				return nil
			},
			persistence.FindEventsQueryForSecretIDs{
				Since:     "event-a",
				SecretIDs: []string{"hashed-user-id-a", "hashed-user-id-b", "hashed-user-id-z"},
			},
			[]persistence.Event{
				{EventID: "event-b", SecretID: strptr("hashed-user-id-b")},
			},
			false,
		},
		{
			"exclusion",
			func(db *gorm.DB) error {
				for _, token := range []string{"a", "b", "c"} {
					if err := db.Save(&Event{
						EventID:  fmt.Sprintf("event-%s", token),
						SecretID: strptr(fmt.Sprintf("hashed-user-id-%s", token)),
					}).Error; err != nil {
						return fmt.Errorf("error saving fixture data: %v", err)
					}
				}
				return nil
			},
			persistence.FindEventsQueryExclusion{
				EventIDs:  []string{"event-a", "event-c"},
				SecretIDs: []string{"hashed-user-id-b", "hashed-user-id-c"},
			},
			[]persistence.Event{
				{EventID: "event-a", SecretID: strptr("hashed-user-id-a")},
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

			result, err := dal.FindEvents(test.query)

			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}

func TestRelationalDAL_DeleteEvents(t *testing.T) {
	tests := []struct {
		name             string
		setup            dbAccess
		query            interface{}
		expectedAffected int64
		expectError      bool
		assertion        dbAccess
	}{
		{
			"bad arg",
			noop,
			[]string{"hey!"},
			0,
			true,
			noop,
		},
		{
			"by event ids",
			func(db *gorm.DB) error {
				for _, token := range []string{"x", "y", "z"} {
					if err := db.Save(&Event{
						EventID: fmt.Sprintf("event-%s", token),
					}).Error; err != nil {
						return fmt.Errorf("error creating fixture record: %v", err)
					}
				}
				return nil
			},
			persistence.DeleteEventsQueryByEventIDs{"event-x", "event-z"},
			2,
			false,
			func(db *gorm.DB) error {
				var count int
				if err := db.Table("events").Count(&count).Error; err != nil {
					return fmt.Errorf("error counting event rows: %v", err)
				}
				if count != 1 {
					return fmt.Errorf("error counting event rows, got %d", count)
				}
				return nil
			},
		},
		{
			"by hashed ids",
			func(db *gorm.DB) error {
				for _, token := range []string{"x", "y", "z"} {
					if err := db.Save(&Event{
						EventID:  fmt.Sprintf("event-%s", token),
						SecretID: strptr(fmt.Sprintf("hashed-user-id-%s", token)),
					}).Error; err != nil {
						return fmt.Errorf("error creating fixture record: %v", err)
					}
				}
				return nil
			},
			persistence.DeleteEventsQueryBySecretIDs{"hashed-user-id-y", "hashed-user-id-z"},
			2,
			false,
			func(db *gorm.DB) error {
				var count int
				if err := db.Table("events").Count(&count).Error; err != nil {
					return fmt.Errorf("error counting event rows: %v", err)
				}
				if count != 1 {
					return fmt.Errorf("error counting event rows, got %d", count)
				}
				return nil
			},
		},
		{
			"by age",
			func(db *gorm.DB) error {
				for _, token := range []string{"x", "y", "z"} {
					if err := db.Save(&Event{
						EventID: fmt.Sprintf("event-%s", token),
					}).Error; err != nil {
						return fmt.Errorf("error creating fixture record: %v", err)
					}
				}
				return nil
			},
			persistence.DeleteEventsQueryOlderThan("event-y"),
			1,
			false,
			func(db *gorm.DB) error {
				var count int
				if err := db.Table("events").Count(&count).Error; err != nil {
					return fmt.Errorf("error counting event rows: %v", err)
				}
				if count != 2 {
					return fmt.Errorf("error counting event rows, got %d", count)
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
				t.Fatalf("Unexpected error setting up test: %v", err)
			}

			affected, err := dal.DeleteEvents(test.query)
			if test.expectedAffected != affected {
				t.Errorf("Expected %d, got %d", test.expectedAffected, affected)
			}

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if err := test.assertion(db); err != nil {
				t.Errorf("Assertion error validating database content: %v", err)
			}
		})
	}
}
