// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"errors"
	"reflect"
	"testing"

	"github.com/offen/offen/server/keys"
)

type mockShareAccountDatabase struct {
	DataAccessLayer
	findAcccountUsersResult []AccountUser
	findAccountUsersErr     error
	createAccountUserErr    error
	createRelationshipErr   error
	commitErr               error
	transactionErr          error
}

func (m *mockShareAccountDatabase) FindAccountUsers(interface{}) ([]AccountUser, error) {
	return m.findAcccountUsersResult, m.findAccountUsersErr
}

func (m *mockShareAccountDatabase) CreateAccountUser(*AccountUser) error {
	return m.createAccountUserErr
}

func (m *mockShareAccountDatabase) CreateAccountUserRelationship(*AccountUserRelationship) error {
	return m.createRelationshipErr
}

func (m *mockShareAccountDatabase) Commit() error {
	return m.commitErr
}

func (m *mockShareAccountDatabase) Rollback() error {
	return nil
}

func (m *mockShareAccountDatabase) Transaction() (Transaction, error) {
	return m, m.transactionErr
}

func (m *mockShareAccountDatabase) FindAccount(interface{}) (Account, error) {
	return Account{Name: "account-name", AccountID: "account-id"}, nil
}

func TestPersistenceLayer_ShareAccount(t *testing.T) {
	tests := []struct {
		name           string
		dal            *mockShareAccountDatabase
		invitee        string
		email          string
		password       string
		accountID      string
		expectedResult ShareAccountResult
		expectErr      bool
	}{
		{
			"bad account users lookup",
			&mockShareAccountDatabase{
				findAccountUsersErr: errors.New("did not work"),
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"",
			ShareAccountResult{},
			true,
		},
		{
			"unknown provider",
			&mockShareAccountDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("hioffen@offen.dev", "develop", 1)
						return *a
					})(),
				},
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"",
			ShareAccountResult{},
			true,
		},
		{
			"bad provider password",
			&mockShareAccountDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("develop@offen.dev", "d3v3lop", 1)
						return *a
					})(),
				},
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"",
			ShareAccountResult{},
			true,
		},
		{
			"error creating invitee user",
			&mockShareAccountDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("develop@offen.dev", "develop", 1)
						return *a
					})(),
				},
				createAccountUserErr: errors.New("did not work"),
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"",
			ShareAccountResult{},
			true,
		},
		{
			"ok - user exists",
			&mockShareAccountDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("develop@offen.dev", "develop", 1)

						emailDerivedKey, _ := keys.DeriveKey("develop@offen.dev", a.Salt)
						passwordDerivedKey, _ := keys.DeriveKey("develop", a.Salt)

						key := []byte("key")
						e, _ := keys.EncryptWith(emailDerivedKey, key)
						p, _ := keys.EncryptWith(passwordDerivedKey, key)

						a.Relationships = []AccountUserRelationship{
							{
								AccountID:                         "account-id",
								AccountUserID:                     a.AccountUserID,
								EmailEncryptedKeyEncryptionKey:    e.Marshal(),
								PasswordEncryptedKeyEncryptionKey: p.Marshal(),
							},
						}
						return *a
					})(),
					(func() AccountUser {
						a, _ := newAccountUser("invitee@offen.dev", "develop", 1)
						return *a
					})(),
				},
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"account-id",
			ShareAccountResult{
				UserExistsWithPassword: true,
				AccountNames:           []string{"account-name"},
			},
			false,
		},
		{
			"ok - user is created",
			&mockShareAccountDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("develop@offen.dev", "develop", 1)

						emailDerivedKey, _ := keys.DeriveKey("develop@offen.dev", a.Salt)
						passwordDerivedKey, _ := keys.DeriveKey("develop", a.Salt)

						key := []byte("key")
						e, _ := keys.EncryptWith(emailDerivedKey, key)
						p, _ := keys.EncryptWith(passwordDerivedKey, key)

						a.Relationships = []AccountUserRelationship{
							{
								AccountID:                         "account-id",
								AccountUserID:                     a.AccountUserID,
								EmailEncryptedKeyEncryptionKey:    e.Marshal(),
								PasswordEncryptedKeyEncryptionKey: p.Marshal(),
							},
						}
						return *a
					})(),
				},
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"account-id",
			ShareAccountResult{
				UserExistsWithPassword: false,
				AccountNames:           []string{"account-name"},
			},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := persistenceLayer{test.dal}
			result, err := p.ShareAccount(test.invitee, test.email, test.password, test.accountID)

			if test.expectErr != (err != nil) {
				t.Errorf("Unexpected error value %v", err)
			}

			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}
		})
	}
}

type mockJoinDatabase struct {
	DataAccessLayer
	findAccountUsersResult []AccountUser
	findAccountUserErr     error
	updateAccountUserErr   error
	updateRelationshipErr  error
	transactionErr         error
	commitErr              error
}

func (m *mockJoinDatabase) FindAccountUsers(interface{}) ([]AccountUser, error) {
	return m.findAccountUsersResult, m.findAccountUserErr
}

func (m *mockJoinDatabase) Commit() error {
	return m.commitErr
}

func (m *mockJoinDatabase) Rollback() error {
	return nil
}

func (m *mockJoinDatabase) Transaction() (Transaction, error) {
	return m, m.transactionErr
}

func (m *mockJoinDatabase) UpdateAccountUserRelationship(*AccountUserRelationship) error {
	return m.updateRelationshipErr
}

func (m *mockJoinDatabase) UpdateAccountUser(*AccountUser) error {
	return m.updateAccountUserErr
}

func TestPersistenceLayer_Join(t *testing.T) {
	tests := []struct {
		name        string
		dal         *mockJoinDatabase
		emailArg    string
		pwArg       string
		expectError bool
	}{
		{
			"lookup error",
			&mockJoinDatabase{
				findAccountUserErr: errors.New("did not work"),
			},
			"foo@bar.com",
			"secret",
			true,
		},
		{
			"no match",
			&mockJoinDatabase{
				findAccountUsersResult: []AccountUser{},
			},
			"foo@bar.com",
			"secret",
			true,
		},
		{
			"bad password",
			&mockJoinDatabase{
				findAccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("foo@bar.com", "s3cret", 1)
						return *a
					})(),
				},
			},
			"foo@bar.com",
			"secret",
			true,
		},
		{
			"transaction error",
			&mockJoinDatabase{
				findAccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("foo@bar.com", "secret", 1)
						return *a
					})(),
				},
				transactionErr: errors.New("did not work"),
			},
			"foo@bar.com",
			"secret",
			true,
		},
		{
			"update error",
			&mockJoinDatabase{
				findAccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("foo@bar.com", "secret", 1)
						emailDerivedKey, _ := keys.DeriveKey("foo@bar.com", a.Salt)

						key := []byte("key")
						c, _ := keys.EncryptWith(emailDerivedKey, key)

						a.Relationships = []AccountUserRelationship{
							{
								AccountID:                      "account-id",
								AccountUserID:                  a.AccountUserID,
								EmailEncryptedKeyEncryptionKey: c.Marshal(),
							},
						}
						return *a
					})(),
				},
				updateRelationshipErr: errors.New("did not work"),
			},
			"foo@bar.com",
			"secret",
			true,
		},
		{
			"commit error",
			&mockJoinDatabase{
				findAccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("foo@bar.com", "secret", 1)
						emailDerivedKey, _ := keys.DeriveKey("foo@bar.com", a.Salt)

						key := []byte("key")
						c, _ := keys.EncryptWith(emailDerivedKey, key)

						a.Relationships = []AccountUserRelationship{
							{
								AccountID:                      "account-id",
								AccountUserID:                  a.AccountUserID,
								EmailEncryptedKeyEncryptionKey: c.Marshal(),
							},
						}
						return *a
					})(),
				},
				commitErr: errors.New("did not work"),
			},
			"foo@bar.com",
			"secret",
			true,
		},
		{
			"not ok - existing user",
			&mockJoinDatabase{
				findAccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("foo@bar.com", "secret", 1)
						emailDerivedKey, _ := keys.DeriveKey("foo@bar.com", a.Salt)

						key := []byte("key")
						c, _ := keys.EncryptWith(emailDerivedKey, key)

						a.Relationships = []AccountUserRelationship{
							{
								AccountID:                      "account-id",
								AccountUserID:                  a.AccountUserID,
								EmailEncryptedKeyEncryptionKey: c.Marshal(),
							},
						}
						return *a
					})(),
				},
			},
			"foo@bar.com",
			"secret",
			true,
		},
		{
			"ok - new user",
			&mockJoinDatabase{
				findAccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("foo@bar.com", "secret", 1)
						a.HashedPassword = ""
						emailDerivedKey, _ := keys.DeriveKey("foo@bar.com", a.Salt)

						key := []byte("key")
						c, _ := keys.EncryptWith(emailDerivedKey, key)

						a.Relationships = []AccountUserRelationship{
							{
								AccountID:                      "account-id",
								AccountUserID:                  a.AccountUserID,
								EmailEncryptedKeyEncryptionKey: c.Marshal(),
							},
						}
						return *a
					})(),
				},
			},
			"foo@bar.com",
			"secret",
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := &persistenceLayer{test.dal}
			err := p.Join(test.emailArg, test.pwArg)
			if test.expectError != (err != nil) {
				t.Errorf("Unexpected error value: %v", err)
			}
		})
	}
}
