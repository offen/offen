// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"errors"
	"fmt"
	"reflect"
	"testing"
)

type assertion func(interface{}) error

type mockInsertEventDatabase struct {
	DataAccessLayer
	findAccountResult Account
	findAccountErr    error
	findSecretResult  Secret
	findSecretErr     error
	createEventErr    error
	methodArgs        []interface{}
}

func (m *mockInsertEventDatabase) FindAccount(q interface{}) (Account, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.findAccountResult, m.findAccountErr
}

func (m *mockInsertEventDatabase) FindSecret(q interface{}) (Secret, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.findSecretResult, m.findSecretErr
}

func (m *mockInsertEventDatabase) CreateEvent(e *Event) error {
	m.methodArgs = append(m.methodArgs, e)
	return m.createEventErr
}

func TestPersistenceLayer_Insert(t *testing.T) {
	tests := []struct {
		name           string
		callArgs       []string
		db             *mockInsertEventDatabase
		expectError    bool
		argsAssertions []assertion
	}{
		{
			"account lookup error",
			[]string{"user-id", "account-id", "payload"},
			&mockInsertEventDatabase{
				findAccountErr: errors.New("did not work"),
			},
			true,
			[]assertion{
				func(accountID interface{}) error {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						if cast != "account-id" {
							return fmt.Errorf("unexpected account identifier %v", cast)
						}
					}
					return nil
				},
			},
		},
		{
			"user lookup error",
			[]string{"user-id", "account-id", "payload"},
			&mockInsertEventDatabase{
				findAccountResult: Account{
					Name:     "test",
					UserSalt: "CaHVhk78uhoPmf5wanA0vg==",
				},
				findSecretErr: errors.New("did not work"),
			},
			true,
			[]assertion{
				func(accountID interface{}) error {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						if cast != "account-id" {
							return fmt.Errorf("unexpected account identifier %v", cast)
						}
					}
					return nil
				},
				func(userID interface{}) error {
					if cast, ok := userID.(FindSecretQueryBySecretID); ok {
						if cast == "user-id" || cast == "" {
							return fmt.Errorf("unexpected user identifier %v", cast)
						}
					}
					return nil
				},
			},
		},
		{
			"insert error",
			[]string{"user-id", "account-id", "payload"},
			&mockInsertEventDatabase{
				findAccountResult: Account{
					Name:     "test",
					UserSalt: "CaHVhk78uhoPmf5wanA0vg==",
				},
				createEventErr: errors.New("did not work"),
			},
			true,
			[]assertion{
				func(accountID interface{}) error {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						if cast != "account-id" {
							return fmt.Errorf("unexpected account identifier %v", cast)
						}
					}
					return nil
				},
				func(userID interface{}) error {
					if cast, ok := userID.(FindSecretQueryBySecretID); ok {
						if cast == "user-id" || cast == "" {
							return fmt.Errorf("unexpected user identifier %v", cast)
						}
					}
					return nil
				},
				func(evt interface{}) error {
					if cast, ok := evt.(*Event); ok {
						wellformed := cast.Payload == "payload" &&
							cast.AccountID == "account-id" &&
							cast.EventID != "" &&
							*cast.SecretID != "user-id"
						if !wellformed {
							return fmt.Errorf("unexpected event shape %v", cast)
						}
					}
					return nil
				},
			},
		},
		{
			"ok",
			[]string{"user-id", "account-id", "payload"},
			&mockInsertEventDatabase{
				findAccountResult: Account{
					Name:     "test",
					UserSalt: "CaHVhk78uhoPmf5wanA0vg==",
				},
			},
			false,
			[]assertion{
				func(accountID interface{}) error {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						if cast != "account-id" {
							return fmt.Errorf("unexpected account identifier %v", cast)
						}
					}
					return nil
				},
				func(userID interface{}) error {
					if cast, ok := userID.(FindSecretQueryBySecretID); ok {
						if cast == "user-id" || cast == "" {
							return fmt.Errorf("unexpected user identifier %v", cast)
						}
					}
					return nil
				},
				func(evt interface{}) error {
					if cast, ok := evt.(*Event); ok {
						wellformed := cast.Payload == "payload" &&
							cast.AccountID == "account-id" &&
							cast.EventID != "" &&
							*cast.SecretID != "user-id"
						if !wellformed {
							return fmt.Errorf("unexpected event shape %v", cast)
						}
					}
					return nil
				},
			},
		},
		{
			"anonymous event ok",
			[]string{"", "account-id", "payload"},
			&mockInsertEventDatabase{
				findAccountResult: Account{
					Name:     "test",
					UserSalt: "CaHVhk78uhoPmf5wanA0vg==",
				},
				findSecretErr: errors.New("did not work"),
			},
			false,
			[]assertion{
				func(accountID interface{}) error {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						if cast != "account-id" {
							return fmt.Errorf("unexpected account identifier %v", cast)
						}
					}
					return nil
				},
				func(evt interface{}) error {
					if cast, ok := evt.(*Event); ok {
						wellformed := cast.Payload == "payload" &&
							cast.AccountID == "account-id" &&
							cast.EventID != "" &&
							cast.SecretID == nil
						if !wellformed {
							return fmt.Errorf("unexpected event shape %v", cast)
						}
					}
					return nil
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			r := &persistenceLayer{
				dal: test.db,
			}
			err := r.Insert(test.callArgs[0], test.callArgs[1], test.callArgs[2])
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
			if expected, found := len(test.argsAssertions), len(test.db.methodArgs); expected != found {
				t.Fatalf("Number of assertions did not match number of calls, got %d and expected %d", found, expected)
			}
			for i, a := range test.argsAssertions {
				if err := a(test.db.methodArgs[i]); err != nil {
					t.Errorf("Unexpected assertion error checking arguments: %v", err)
				}
			}
		})
	}
}

type mockPurgeEventsDatabase struct {
	DataAccessLayer
	findAccountsResult []Account
	findAccountsErr    error
	deleteEventsResult int64
	deleteEventsErr    error
	methodArgs         []interface{}
}

func (m *mockPurgeEventsDatabase) FindAccounts(q interface{}) ([]Account, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.findAccountsResult, m.findAccountsErr
}

func (m *mockPurgeEventsDatabase) DeleteEvents(q interface{}) (int64, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.deleteEventsResult, m.deleteEventsErr
}

func TestPersistenceLayer_Purge(t *testing.T) {
	tests := []struct {
		name          string
		db            *mockPurgeEventsDatabase
		expectError   bool
		argAssertions []assertion
	}{
		{
			"account lookup error",
			&mockPurgeEventsDatabase{
				findAccountsErr: errors.New("did not work"),
			},
			true,
			[]assertion{
				func(q interface{}) error {
					if _, ok := q.(FindAccountsQueryAllAccounts); ok {
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
		{
			"delete events error",
			&mockPurgeEventsDatabase{
				findAccountsResult: []Account{
					{UserSalt: "JF+rNeViJeJb0jth6ZheWg=="},
					{UserSalt: "D6xdWYfRqbuWrkg4OWVgGQ=="},
				},
				deleteEventsErr: errors.New("did not work"),
			},
			true,
			[]assertion{
				func(q interface{}) error {
					if _, ok := q.(FindAccountsQueryAllAccounts); ok {
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
				func(q interface{}) error {
					if hashes, ok := q.(DeleteEventsQueryBySecretIDs); ok {
						for _, hash := range hashes {
							if hash == "user-id" {
								return errors.New("encountered plain user id when hash was expected")
							}
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
		{
			"ok",
			&mockPurgeEventsDatabase{
				findAccountsResult: []Account{
					{UserSalt: "JF+rNeViJeJb0jth6ZheWg=="},
					{UserSalt: "D6xdWYfRqbuWrkg4OWVgGQ=="},
				},
			},
			false,
			[]assertion{
				func(q interface{}) error {
					if _, ok := q.(FindAccountsQueryAllAccounts); ok {
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
				func(q interface{}) error {
					if hashes, ok := q.(DeleteEventsQueryBySecretIDs); ok {
						for _, hash := range hashes {
							if hash == "user-id" {
								return errors.New("encountered plain user id when hash was expected")
							}
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			r := &persistenceLayer{
				dal: test.db,
			}
			err := r.Purge("user-id")
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
			if expected, found := len(test.argAssertions), len(test.db.methodArgs); expected != found {
				t.Fatalf("Number of assertions did not match number of calls, got %d and expected %d", found, expected)
			}
			for i, a := range test.argAssertions {
				if err := a(test.db.methodArgs[i]); err != nil {
					t.Errorf("Assertion error when checking arguments: %v", err)
				}
			}
		})
	}
}

type mockQueryEventDatabase struct {
	DataAccessLayer
	findAccountsResult []Account
	findAccountsErr    error
	findEventsResult   []Event
	findEventsErr      error
	methodArgs         []interface{}
}

func (m *mockQueryEventDatabase) FindAccounts(q interface{}) ([]Account, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.findAccountsResult, m.findAccountsErr
}

func (m *mockQueryEventDatabase) FindEvents(q interface{}) ([]Event, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.findEventsResult, m.findEventsErr
}

func TestPersistenceLayer_Query(t *testing.T) {
	tests := []struct {
		name           string
		db             *mockQueryEventDatabase
		expectedResult map[string][]EventResult
		expectError    bool
		argAssertions  []assertion
	}{
		{
			"find accounts error",
			&mockQueryEventDatabase{
				findAccountsErr: errors.New("did not work"),
			},
			nil,
			true,
			[]assertion{
				func(q interface{}) error {
					if _, ok := q.(FindAccountsQueryAllAccounts); ok {
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
		{
			"find events error",
			&mockQueryEventDatabase{
				findAccountsResult: []Account{
					{UserSalt: "LEWtq55DKObqPK+XEQbnZA=="},
					{UserSalt: "kxwkHp6yPBd0tQ85XlayDg=="},
				},
				findEventsErr: errors.New("did not work"),
			},
			nil,
			true,
			[]assertion{
				func(q interface{}) error {
					if _, ok := q.(FindAccountsQueryAllAccounts); ok {
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
				func(q interface{}) error {
					if query, ok := q.(FindEventsQueryForSecretIDs); ok {
						if query.Since != "yesterday" {
							return fmt.Errorf("unexpected since value: %v", query.Since)
						}
						if len(query.SecretIDs) != 2 {
							return fmt.Errorf("unexpected number of user ids: %d", len(query.SecretIDs))
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
		{
			"ok",
			&mockQueryEventDatabase{
				findAccountsResult: []Account{
					{AccountID: "account-a", UserSalt: "LEWtq55DKObqPK+XEQbnZA=="},
					{AccountID: "account-b", UserSalt: "kxwkHp6yPBd0tQ85XlayDg=="},
				},
				findEventsResult: []Event{
					{AccountID: "account-a", EventID: "event-a", Payload: "payload-a"},
					{AccountID: "account-b", EventID: "event-b", Payload: "payload-b"},
				},
			},
			map[string][]EventResult{
				"account-a": []EventResult{
					{AccountID: "account-a", Payload: "payload-a", EventID: "event-a"},
				},
				"account-b": []EventResult{
					{AccountID: "account-b", Payload: "payload-b", EventID: "event-b"},
				},
			},
			false,
			[]assertion{
				func(q interface{}) error {
					if _, ok := q.(FindAccountsQueryAllAccounts); ok {
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
				func(q interface{}) error {
					if query, ok := q.(FindEventsQueryForSecretIDs); ok {
						if query.Since != "yesterday" {
							return fmt.Errorf("unexpected since value: %v", query.Since)
						}
						if len(query.SecretIDs) != 2 {
							return fmt.Errorf("unexpected number of user ids: %d", len(query.SecretIDs))
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := &persistenceLayer{
				dal: test.db,
			}
			result, err := p.Query(Query{
				UserID: "user-id",
				Since:  "yesterday",
			})

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}

			if expected, found := len(test.argAssertions), len(test.db.methodArgs); expected != found {
				t.Fatalf("Number of assertions did not match number of calls, expected %d and found %d", expected, found)
			}

			for i, a := range test.argAssertions {
				if err := a(test.db.methodArgs[i]); err != nil {
					t.Errorf("Assertion error when checking arguments: %v", err)
				}
			}
		})
	}
}

type mockGetDeletedEventsDatabase struct {
	DataAccessLayer
	findAccountsResult []Account
	findAccountsErr    error
	findEventsResults  [][]Event
	findEventsErrs     []error
	methodArgs         []interface{}
}

func (m *mockGetDeletedEventsDatabase) FindAccounts(q interface{}) ([]Account, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.findAccountsResult, m.findAccountsErr
}

func (m *mockGetDeletedEventsDatabase) FindEvents(q interface{}) ([]Event, error) {
	m.methodArgs = append(m.methodArgs, q)
	var result []Event
	if len(m.findEventsResults) > 0 {
		result = m.findEventsResults[0]
	}
	if len(m.findEventsResults) > 1 {
		m.findEventsResults = m.findEventsResults[1:]
	}
	var err error
	if len(m.findEventsErrs) > 0 {
		err = m.findEventsErrs[0]
	}
	if len(m.findEventsErrs) > 1 {
		m.findEventsErrs = m.findEventsErrs[1:]
	}
	return result, err
}

func TestPersistenceLayer_GetDeletedEvents(t *testing.T) {
	tests := []struct {
		name           string
		db             *mockGetDeletedEventsDatabase
		userIDArg      string
		expectError    bool
		expectedResult []string
		argAssertions  []assertion
	}{
		{
			"error finding events",
			&mockGetDeletedEventsDatabase{
				findEventsErrs: []error{
					errors.New("did not work"),
				},
			},
			"user-id",
			true,
			nil,
			[]assertion{
				func(q interface{}) error {
					if ids, ok := q.(FindEventsQueryByEventIDs); ok {
						if !reflect.DeepEqual([]string(ids), []string{"event-a", "event-m", "event-z"}) {
							return fmt.Errorf("unexpected list of event ids: %v", ids)
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
		{
			"ok no user id",
			&mockGetDeletedEventsDatabase{
				findEventsResults: [][]Event{
					[]Event{
						{EventID: "event-a"},
						{EventID: "event-z"},
					},
				},
			},
			"",
			false,
			[]string{"event-m"},
			[]assertion{
				func(q interface{}) error {
					if ids, ok := q.(FindEventsQueryByEventIDs); ok {
						if !reflect.DeepEqual([]string(ids), []string{"event-a", "event-m", "event-z"}) {
							return fmt.Errorf("unexpected list of event ids: %v", ids)
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
		{
			"error finding accounts",
			&mockGetDeletedEventsDatabase{
				findEventsErrs: []error{
					nil,
				},
				findEventsResults: [][]Event{
					[]Event{
						{EventID: "event-a"},
						{EventID: "event-z"},
					},
				},
				findAccountsErr: errors.New("did not work"),
			},
			"user-id",
			true,
			nil,
			[]assertion{
				func(q interface{}) error {
					if ids, ok := q.(FindEventsQueryByEventIDs); ok {
						if !reflect.DeepEqual([]string(ids), []string{"event-a", "event-m", "event-z"}) {
							return fmt.Errorf("unexpected list of event ids: %v", ids)
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
				func(q interface{}) error {
					if _, ok := q.(FindAccountsQueryAllAccounts); ok {
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
		{
			"error finding exclusive events",
			&mockGetDeletedEventsDatabase{
				findEventsErrs: []error{
					nil,
					errors.New("did not work"),
				},
				findEventsResults: [][]Event{
					[]Event{
						{EventID: "event-a"},
						{EventID: "event-z"},
					},
				},
				findAccountsResult: []Account{
					{UserSalt: "hYNyqFJnGq9fEJ+PW8CRwQ=="},
				},
			},
			"user-id",
			true,
			nil,
			[]assertion{
				func(q interface{}) error {
					if ids, ok := q.(FindEventsQueryByEventIDs); ok {
						if !reflect.DeepEqual([]string(ids), []string{"event-a", "event-m", "event-z"}) {
							return fmt.Errorf("unexpected list of event ids: %v", ids)
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
				func(q interface{}) error {
					if _, ok := q.(FindAccountsQueryAllAccounts); ok {
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
				func(q interface{}) error {
					if query, ok := q.(FindEventsQueryExclusion); ok {
						if !reflect.DeepEqual(query.EventIDs, []string{"event-a", "event-m", "event-z"}) {
							return fmt.Errorf("unexpected list of event ids %v", query.EventIDs)
						}
						if len(query.SecretIDs) != 1 {
							return fmt.Errorf("unexpected number of user ids %v", len(query.SecretIDs))
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
		{
			"ok with user id",
			&mockGetDeletedEventsDatabase{
				findEventsErrs: []error{
					nil,
					nil,
				},
				findEventsResults: [][]Event{
					[]Event{
						{EventID: "event-a"},
						{EventID: "event-z"},
					},
					[]Event{
						{EventID: "event-z"},
					},
				},
				findAccountsResult: []Account{
					{UserSalt: "hYNyqFJnGq9fEJ+PW8CRwQ=="},
				},
			},
			"user-id",
			false,
			[]string{"event-m", "event-z"},
			[]assertion{
				func(q interface{}) error {
					if ids, ok := q.(FindEventsQueryByEventIDs); ok {
						if !reflect.DeepEqual([]string(ids), []string{"event-a", "event-m", "event-z"}) {
							return fmt.Errorf("unexpected list of event ids: %v", ids)
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
				func(q interface{}) error {
					if _, ok := q.(FindAccountsQueryAllAccounts); ok {
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
				func(q interface{}) error {
					if query, ok := q.(FindEventsQueryExclusion); ok {
						if !reflect.DeepEqual(query.EventIDs, []string{"event-a", "event-m", "event-z"}) {
							return fmt.Errorf("unexpected list of event ids %v", query.EventIDs)
						}
						if len(query.SecretIDs) != 1 {
							return fmt.Errorf("unexpected number of user ids %v", len(query.SecretIDs))
						}
						return nil
					}
					return fmt.Errorf("unexpected argument %v", q)
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := persistenceLayer{
				dal: test.db,
			}
			result, err := p.GetDeletedEvents([]string{"event-a", "event-m", "event-z"}, test.userIDArg)

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}

			if expected, found := len(test.argAssertions), len(test.db.methodArgs); expected != found {
				t.Fatalf("Number of assertions did not match number of calls, expected %d and found %d", expected, found)
			}

			for i, a := range test.argAssertions {
				if err := a(test.db.methodArgs[i]); err != nil {
					t.Errorf("Assertion error when checking arguments: %v", err)
				}
			}
		})
	}
}
