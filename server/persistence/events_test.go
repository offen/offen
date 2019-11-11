package persistence

import (
	"errors"
	"fmt"
	"testing"
)

type assertion func(interface{}) error

type mockInsertEventDatabase struct {
	DataAccessLayer
	findAccountResult Account
	findAccountErr    error
	findUserResult    User
	findUserErr       error
	createEventErr    error
	methodArgs        []interface{}
}

func (m *mockInsertEventDatabase) FindAccount(q interface{}) (Account, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.findAccountResult, m.findAccountErr
}

func (m *mockInsertEventDatabase) FindUser(q interface{}) (User, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.findUserResult, m.findUserErr
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
				findUserErr: errors.New("did not work"),
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
					if cast, ok := userID.(FindUserQueryByHashedUserID); ok {
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
					if cast, ok := userID.(FindUserQueryByHashedUserID); ok {
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
							*cast.HashedUserID != "user-id"
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
					if cast, ok := userID.(FindUserQueryByHashedUserID); ok {
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
							*cast.HashedUserID != "user-id"
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
				findUserErr: errors.New("did not work"),
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
							cast.HashedUserID == nil
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
					if hashes, ok := q.(DeleteEventsQueryByHashedIDs); ok {
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
					if hashes, ok := q.(DeleteEventsQueryByHashedIDs); ok {
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
