// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"errors"
	"fmt"
	"reflect"
	"testing"

	"github.com/lestrrat-go/jwx/jwk"
)

var publicKey = `
{
  "alg": "RSA-OAEP-256",
  "e": "AQAB",
  "ext": true,
  "key_ops": [
    "encrypt"
  ],
  "kty": "RSA",
  "n": "rJGC_lJ8tpAq8xaPFnvbkZDNUQxQ47_1gJ1A_TIM03uK2KuI1m-4DQsBmT8RfcRhI-ecvY5D4cqXmwKZxBXii7QjQeoFg3TApT4E4l1ZF4EBO_D9-1nlwM4C17Ip9Cardu09kp1vv2FVML0zFGCrS8Dvo4oQBtoieA_MmSyKRpJPN0we4gYxftjqpVym1cCsIeR7riBS_FvMsXph-R7OLKEiL_y4WUoi4wWal5Z3MsSYRRj4hwm-nllAwu2_dOtHSh8L8PlhqShDSNrn31feicpeMr08NVTMaJZjoLIXR_CT3V_E_E2JkKsrj8lWmp34ww7iMSWRE8woSXjv75Ieow"
}
`

func strptr(s string) *string { return &s }

type mockGetAccountDatabase struct {
	DataAccessLayer
	findAccountResult Account
	findAccountErr    error
	methodArgs        []interface{}
}

func (m *mockGetAccountDatabase) FindAccount(q interface{}) (Account, error) {
	m.methodArgs = append(m.methodArgs, q)
	return m.findAccountResult, m.findAccountErr
}

func (m *mockGetAccountDatabase) FindTombstones(q interface{}) ([]Tombstone, error) {
	return nil, nil
}

func TestPersistenceLayer_GetAccount(t *testing.T) {
	tests := []struct {
		name           string
		persistence    *mockGetAccountDatabase
		includeEvents  bool
		since          string
		expectedResult AccountResult
		expectError    bool
		argsAssertions []assertion
	}{
		{
			"find account error",
			&mockGetAccountDatabase{
				findAccountErr: errors.New("did not work"),
			},
			false,
			"",
			AccountResult{},
			true,
			[]assertion{
				func(q interface{}) error {
					if query, ok := q.(FindAccountQueryActiveByID); ok {
						if string(query) != "account-id" {
							return fmt.Errorf("unexpected account id %v", query)
						}
						return nil
					}
					return fmt.Errorf("Unexpected arg type %v", q)
				},
			},
		},
		{
			"include events",
			&mockGetAccountDatabase{
				findAccountResult: Account{
					AccountID:           "account-id",
					Name:                "name",
					PublicKey:           publicKey,
					EncryptedPrivateKey: "encrypted-private-key",
					Events: []Event{
						{Secret: Secret{EncryptedSecret: "aaaaa"}, SecretID: strptr("hashed-user-a"), EventID: "event-a", AccountID: "account-id", Payload: "payload-a"},
						{Secret: Secret{EncryptedSecret: "bbbbb"}, SecretID: strptr("hashed-user-b"), EventID: "event-b", AccountID: "account-id", Payload: "payload-b"},
						{EventID: "event-c", AccountID: "account-id", Payload: "payload-c"},
					},
				},
			},
			true,
			"since",
			AccountResult{
				AccountID:           "account-id",
				Name:                "name",
				EncryptedPrivateKey: "encrypted-private-key",
				Events: &EventsByAccountID{
					"account-id": []EventResult{
						{EventID: "event-a", SecretID: strptr("hashed-user-a"), Payload: "payload-a"},
						{EventID: "event-b", SecretID: strptr("hashed-user-b"), Payload: "payload-b"},
						{EventID: "event-c", Payload: "payload-c"},
					},
				},
				PublicKey: (func() jwk.Key {
					s, _ := jwk.ParseString(publicKey)
					return s.Keys[0]
				})(),
				Secrets: &EncryptedSecretsByID{
					"hashed-user-a": "aaaaa",
					"hashed-user-b": "bbbbb",
				},
			},
			false,
			[]assertion{
				func(q interface{}) error {
					if query, ok := q.(FindAccountQueryIncludeEvents); ok {
						if query.Since != "since" {
							return fmt.Errorf("unexpected since parameter %v", query.Since)
						}
						if query.AccountID != "account-id" {
							return fmt.Errorf("unexpected account id parameter %v", query.AccountID)
						}
						return nil
					}
					return fmt.Errorf("Unexpected arg type %v", q)
				},
			},
		},
		{
			"no events",
			&mockGetAccountDatabase{
				findAccountResult: Account{
					AccountID:           "account-id",
					Name:                "name",
					PublicKey:           publicKey,
					EncryptedPrivateKey: "encrypted-private-key",
					Events: []Event{
						{Secret: Secret{EncryptedSecret: "aaaaa"}, SecretID: strptr("hashed-user-a"), EventID: "event-a", AccountID: "account-id", Payload: "payload-a"},
						{Secret: Secret{EncryptedSecret: "bbbbb"}, SecretID: strptr("hashed-user-b"), EventID: "event-b", AccountID: "account-id", Payload: "payload-b"},
						{EventID: "event-c", AccountID: "account-id", Payload: "payload-c"},
					},
				},
			},
			false,
			"since",
			AccountResult{
				AccountID: "account-id",
				Name:      "name",
				PublicKey: (func() jwk.Key {
					s, _ := jwk.ParseString(publicKey)
					return s.Keys[0]
				})(),
			},
			false,
			[]assertion{
				func(q interface{}) error {
					if query, ok := q.(FindAccountQueryActiveByID); ok {
						if string(query) != "account-id" {
							return fmt.Errorf("unexpected account id %v", query)
						}
						return nil
					}
					return fmt.Errorf("Unexpected arg type %v", q)
				},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := &persistenceLayer{dal: test.persistence}

			result, err := p.GetAccount("account-id", test.includeEvents, test.since)
			if !reflect.DeepEqual(test.expectedResult, result) {
				t.Errorf("Expected %#v, got %#v", test.expectedResult, result)
			}

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if expected, found := len(test.argsAssertions), len(test.persistence.methodArgs); expected != found {
				t.Fatalf("Number of assertions did not match number of calls, got %d and expected %d", found, expected)
			}

			for i, a := range test.argsAssertions {
				if err := a(test.persistence.methodArgs[i]); err != nil {
					t.Errorf("Assertion error validating argument at index %d: %v", i, err)
				}
			}
		})
	}
}

type mockAssociateUserSecretDatabase struct {
	DataAccessLayer
	methodArgs []interface{}
}

func TestPersistenceLayer_AssociateUserSecret(t *testing.T) {
	tests := []struct {
		name           string
		dal            *mockAssociateUserSecretDatabase
		expectError    bool
		argsAssertions []assertion
	}{}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := &persistenceLayer{dal: test.dal}

			err := p.AssociateUserSecret("account-id", "user-id", "encrypted-user-secret")

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
			if expected, found := len(test.argsAssertions), len(test.dal.methodArgs); expected != found {
				t.Fatalf("Number of assertions did not match number of calls, got %d and expected %d", found, expected)
			}
			for i, a := range test.argsAssertions {
				if err := a(test.dal.methodArgs[i]); err != nil {
					t.Errorf("Assertion error validating argument at index %d: %v", i, err)
				}
			}
		})
	}
}

type mockRetireAccountDatabase struct {
	DataAccessLayer
	updateErr         error
	deleteErr         error
	txnErr            error
	findAccountResult Account
	findAccountErr    error
}

func (m *mockRetireAccountDatabase) UpdateAccount(*Account) error {
	return m.updateErr
}

func (m *mockRetireAccountDatabase) DeleteAccountUserRelationships(interface{}) error {
	return m.deleteErr
}
func (m *mockRetireAccountDatabase) FindAccount(interface{}) (Account, error) {
	return m.findAccountResult, m.findAccountErr
}

func (m *mockRetireAccountDatabase) Commit() error {
	return nil
}

func (m *mockRetireAccountDatabase) Rollback() error {
	return nil
}

func (m *mockRetireAccountDatabase) Transaction() (Transaction, error) {
	return m, m.txnErr
}

func TestPersistenceLayer_RetireAccount(t *testing.T) {
	tests := []struct {
		name        string
		db          *mockRetireAccountDatabase
		expectError bool
	}{
		{
			"update error",
			&mockRetireAccountDatabase{
				updateErr: errors.New("did not work"),
			},
			true,
		},
		{
			"delete error",
			&mockRetireAccountDatabase{
				deleteErr: errors.New("did not work"),
			},
			true,
		},
		{
			"transaction error",
			&mockRetireAccountDatabase{
				txnErr: errors.New("did not work"),
			},
			true,
		},
		{
			"ok",
			&mockRetireAccountDatabase{},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			p := persistenceLayer{test.db}
			err := p.RetireAccount("account-a")
			if test.expectError != (err != nil) {
				t.Errorf("Unexpected error value: %v", err)
			}
		})
	}
}
