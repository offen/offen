package persistence

import (
	"errors"
	"testing"
)

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

func TestRelationalDatabase_Insert(t *testing.T) {
	tests := []struct {
		name           string
		callArgs       []string
		db             *mockInsertEventDatabase
		expectError    bool
		argsAssertions []func(interface{}) bool
	}{
		{
			"account lookup error",
			[]string{"user-id", "account-id", "payload"},
			&mockInsertEventDatabase{
				findAccountErr: errors.New("did not work"),
			},
			true,
			[]func(interface{}) bool{
				func(accountID interface{}) bool {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						return cast == "account-id"
					}
					return false
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
			[]func(interface{}) bool{
				func(accountID interface{}) bool {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						return cast == "account-id"
					}
					return false
				},
				func(userID interface{}) bool {
					if cast, ok := userID.(FindUserQueryByHashedUserID); ok {
						return cast != "user-id" && cast != ""
					}
					return false
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
			[]func(interface{}) bool{
				func(accountID interface{}) bool {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						return cast == "account-id"
					}
					return false
				},
				func(userID interface{}) bool {
					if cast, ok := userID.(FindUserQueryByHashedUserID); ok {
						return cast != "user-id" && cast != ""
					}
					return false
				},
				func(evt interface{}) bool {
					if cast, ok := evt.(*Event); ok {
						return cast.Payload == "payload" &&
							cast.AccountID == "account-id" &&
							cast.EventID != "" &&
							*cast.HashedUserID != "user-id"
					}
					return false
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
			[]func(interface{}) bool{
				func(accountID interface{}) bool {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						return cast == "account-id"
					}
					return false
				},
				func(userID interface{}) bool {
					if cast, ok := userID.(FindUserQueryByHashedUserID); ok {
						return cast != "user-id" && cast != ""
					}
					return false
				},
				func(evt interface{}) bool {
					if cast, ok := evt.(*Event); ok {
						return cast.Payload == "payload" &&
							cast.AccountID == "account-id" &&
							cast.EventID != "" &&
							*cast.HashedUserID != "user-id"
					}
					return false
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
			[]func(interface{}) bool{
				func(accountID interface{}) bool {
					if cast, ok := accountID.(FindAccountQueryActiveByID); ok {
						return cast == "account-id"
					}
					return false
				},
				func(evt interface{}) bool {
					if cast, ok := evt.(*Event); ok {
						return cast.Payload == "payload" &&
							cast.AccountID == "account-id" &&
							cast.EventID != "" &&
							cast.HashedUserID == nil
					}
					return false
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			r := &relationalDatabase{
				db: test.db,
			}
			err := r.Insert(test.callArgs[0], test.callArgs[1], test.callArgs[2])
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
			for i, assertion := range test.argsAssertions {
				if !assertion(test.db.methodArgs[i]) {
					t.Errorf("Argument %v at index %d did not pass assertion", test.db.methodArgs[i], i)
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
}

func (m *mockPurgeEventsDatabase) FindAccounts(q interface{}) ([]Account, error) {
	return m.findAccountsResult, m.findAccountsErr
}

func (m *mockPurgeEventsDatabase) DeleteEvents(q interface{}) (int64, error) {
	return m.deleteEventsResult, m.deleteEventsErr
}

func TestRelationalDatabase_Purge(t *testing.T) {
	tests := []struct {
		name        string
		db          *mockPurgeEventsDatabase
		expectError bool
	}{
		{
			"account lookup error",
			&mockPurgeEventsDatabase{
				findAccountsErr: errors.New("did not work"),
			},
			true,
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
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			r := &relationalDatabase{
				db: test.db,
			}
			err := r.Purge("user-id")
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}
