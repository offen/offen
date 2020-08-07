// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

// DataAccessLayer provides a database agnostic interface for storing data. All
// query methods expect certain types to be passed. In case a unknown query is
// passed, an error can be returned early.
type DataAccessLayer interface {
	CreateEvent(*Event) error
	FindEvents(interface{}) ([]Event, error)
	DeleteEvents(interface{}) (int64, error)
	CreateSecret(*Secret) error
	FindSecret(interface{}) (Secret, error)
	DeleteSecret(interface{}) error
	CreateAccount(*Account) error
	UpdateAccount(*Account) error
	FindAccount(interface{}) (Account, error)
	FindAccounts(interface{}) ([]Account, error)
	CreateAccountUser(*AccountUser) error
	FindAccountUser(interface{}) (AccountUser, error)
	FindAccountUsers(interface{}) ([]AccountUser, error)
	UpdateAccountUser(*AccountUser) error
	CreateAccountUserRelationship(*AccountUserRelationship) error
	UpdateAccountUserRelationship(*AccountUserRelationship) error
	FindAccountUserRelationships(interface{}) ([]AccountUserRelationship, error)
	DeleteAccountUserRelationships(interface{}) error
	CreateTombstone(*Tombstone) error
	FindTombstones(interface{}) ([]Tombstone, error)
	Transaction() (Transaction, error)
	ApplyMigrations() error
	DropAll() error
	ProbeEmpty() bool
	Ping() error
}

// FindEventsQueryForSecretIDs requests all events that match the list of
// secret identifiers. In case the Since value is non-zero it will be used to request
// only events that are newer than the given ULID.
type FindEventsQueryForSecretIDs struct {
	SecretIDs []string
	Since     string
}

// FindEventsQueryByEventIDs requests all events that match the given list of
// identifiers.
type FindEventsQueryByEventIDs []string

// FindEventsQueryOlderThan looks up all events older than the given event id
type FindEventsQueryOlderThan string

// DeleteEventsQueryBySecretIDs requests deletion of all events that match
// the given identifiers.
type DeleteEventsQueryBySecretIDs []string

// DeleteEventsQueryByEventIDs requests deletion of all events contained in the
// given set.
type DeleteEventsQueryByEventIDs []string

// DeleteEventsQueryOlderThan requests deletion of all events older than the
// given deadline
type DeleteEventsQueryOlderThan string

// DeleteSecretQueryBySecretID requests deletion of the secret record with the given
// secret id.
type DeleteSecretQueryBySecretID string

// FindSecretQueryBySecretID requests the secret of the given ID
type FindSecretQueryBySecretID string

// FindAccountQueryActiveByID requests a non-retired account of the given ID
type FindAccountQueryActiveByID string

// FindAccountQueryByID requests the account of the given id.
type FindAccountQueryByID string

// FindAccountQueryIncludeEvents requests the account of the given id including
// all of the associated events. In case the value for Since is non-zero, only
// events newer than the given value should be considered.
type FindAccountQueryIncludeEvents struct {
	AccountID string
	Since     string
}

// FindAccountsQueryAllAccounts requests all known accounts to be returned.
type FindAccountsQueryAllAccounts struct{}

// FindAccountUserQueryByAccountUserIDIncludeRelationships requests the account user of
// the given id and all of its relationships.
type FindAccountUserQueryByAccountUserIDIncludeRelationships string

// FindAccountUserRelationshipsQueryByAccountUserID requests all relationships for the user
// with the given account user ID.
type FindAccountUserRelationshipsQueryByAccountUserID string

// DeleteAccountUserRelationshipsQueryByAccountID requests deletion of all relationships
// with the given account id.
type DeleteAccountUserRelationshipsQueryByAccountID string

// FindAccountUsersQueryAllAccountUsers requests all account users.
type FindAccountUsersQueryAllAccountUsers struct {
	IncludeRelationships bool
	IncludeInvitations   bool
}

// RetireAccountQueryByID requests the account of the given id to be retired.
type RetireAccountQueryByID string

// FindTombstonesQueryByAccounts requests all tombstones for an account id that are
// newer than the given sequence
type FindTombstonesQueryByAccounts struct {
	Since      string
	AccountIDs []string
}

// FindTombstonesQueryBySecrets requests all tombstones for an account id that are
// newer than the given sequence
type FindTombstonesQueryBySecrets struct {
	Since     string
	SecretIDs []string
}

// Transaction is a data access layer that does not persist data until commit
// is called. In case rollback is called before, the underlying database will
// remain in the same state as before.
type Transaction interface {
	DataAccessLayer
	Rollback() error
	Commit() error
}
