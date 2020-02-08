package persistence

import (
	"errors"
	"testing"

	"github.com/offen/offen/server/keys"
)

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
