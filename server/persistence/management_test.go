package persistence

import (
	"errors"
	"reflect"
	"testing"

	"github.com/offen/offen/server/keys"
)

type mockInviteUserDatabase struct {
	DataAccessLayer
	findAcccountUsersResult []AccountUser
	findAccountUsersErr     error
	createAccountUserErr    error
	createRelationshipErr   error
	commitErr               error
	transactionErr          error
}

func (m *mockInviteUserDatabase) FindAccountUsers(interface{}) ([]AccountUser, error) {
	return m.findAcccountUsersResult, m.findAccountUsersErr
}

func (m *mockInviteUserDatabase) CreateAccountUser(*AccountUser) error {
	return m.createAccountUserErr
}

func (m *mockInviteUserDatabase) CreateAccountUserRelationship(*AccountUserRelationship) error {
	return m.createRelationshipErr
}

func (m *mockInviteUserDatabase) Commit() error {
	return m.commitErr
}

func (m *mockInviteUserDatabase) Rollback() error {
	return nil
}

func (m *mockInviteUserDatabase) Transaction() (Transaction, error) {
	return m, m.transactionErr
}

func TestPersistenceLayer_InviteUser(t *testing.T) {
	tests := []struct {
		name           string
		dal            *mockInviteUserDatabase
		invitee        string
		email          string
		password       string
		accountID      string
		expectedResult InviteUserResult
		expectErr      bool
	}{
		{
			"bad account users lookup",
			&mockInviteUserDatabase{
				findAccountUsersErr: errors.New("did not work"),
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"",
			InviteUserResult{},
			true,
		},
		{
			"unknown provider",
			&mockInviteUserDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("hioffen@offen.dev", "develop")
						return *a
					})(),
				},
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"",
			InviteUserResult{},
			true,
		},
		{
			"bad provider password",
			&mockInviteUserDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("develop@offen.dev", "d3v3lop")
						return *a
					})(),
				},
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"",
			InviteUserResult{},
			true,
		},
		{
			"error creating invitee user",
			&mockInviteUserDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("develop@offen.dev", "develop")
						return *a
					})(),
				},
				createAccountUserErr: errors.New("did not work"),
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"",
			InviteUserResult{},
			true,
		},
		{
			"ok - user exists",
			&mockInviteUserDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("develop@offen.dev", "develop")

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
						a, _ := newAccountUser("invitee@offen.dev", "develop")
						return *a
					})(),
				},
			},
			"invitee@offen.dev",
			"develop@offen.dev",
			"develop",
			"account-id",
			InviteUserResult{
				UserExistsWithPassword: true,
				AccountIDs:             []string{"account-id"},
			},
			false,
		},
		{
			"ok - user is created",
			&mockInviteUserDatabase{
				findAcccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("develop@offen.dev", "develop")

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
			InviteUserResult{
				UserExistsWithPassword: false,
				AccountIDs:             []string{"account-id"},
			},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := persistenceLayer{test.dal}
			result, err := p.InviteUser(test.invitee, test.email, test.password, test.accountID)

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
						a, _ := newAccountUser("foo@bar.com", "s3cret")
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
						a, _ := newAccountUser("foo@bar.com", "secret")
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
						a, _ := newAccountUser("foo@bar.com", "secret")
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
						a, _ := newAccountUser("foo@bar.com", "secret")
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
			"ok - existing user",
			&mockJoinDatabase{
				findAccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("foo@bar.com", "secret")
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
		{
			"ok - new user",
			&mockJoinDatabase{
				findAccountUsersResult: []AccountUser{
					(func() AccountUser {
						a, _ := newAccountUser("foo@bar.com", "secret")
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
