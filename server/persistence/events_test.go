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
}

func (m *mockInsertEventDatabase) FindAccount(q interface{}) (Account, error) {
	return m.findAccountResult, m.findAccountErr
}

func (m *mockInsertEventDatabase) FindUser(q interface{}) (User, error) {
	return m.findUserResult, m.findUserErr
}

func (m *mockInsertEventDatabase) CreateEvent(e *Event) error {
	return m.createEventErr
}

func TestRelationalDatabase_Insert(t *testing.T) {
	tests := []struct {
		name        string
		callArgs    []string
		db          *mockInsertEventDatabase
		expectError bool
	}{
		{
			"account lookup error",
			[]string{"user-id", "account-id", "payload"},
			&mockInsertEventDatabase{
				findAccountErr: errors.New("did not work"),
			},
			true,
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
