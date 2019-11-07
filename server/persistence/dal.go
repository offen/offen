package persistence

// DataAccessLayer provides a database agnostic interface for storing data. All
// query methods expect certain types to be passed. In case a unknown query is
// passed, an error can be returned early.
type DataAccessLayer interface {
	CreateEvent(*Event) error
	FindEvents(interface{}) ([]Event, error)
	DeleteEvents(interface{}) (int64, error)
	CreateUser(*User) error
	FindUser(interface{}) (User, error)
	DeleteUser(interface{}) error
	CreateAccount(*Account) error
	FindAccount(interface{}) (Account, error)
	FindAccounts(interface{}) ([]Account, error)
	CreateAccountUser(*AccountUser) error
	FindAccountUser(interface{}) (AccountUser, error)
	UpdateAccountUser(*AccountUser) error
	CreateAccountUserRelationship(*AccountUserRelationship) error
	UpdateAccountUserRelationship(*AccountUserRelationship) error
	FindAccountUserRelationships(interface{}) ([]AccountUserRelationship, error)
	Transaction() (Transaction, error)
	ApplyMigrations() error
	DropAll() error
	Ping() error
}

// FindEventsQueryForHashedIDs requests all events that match the list of hashed
// user identifiers. In case the Since value is non-zero it will be used to request
// only events that are newer than the given ULID.
type FindEventsQueryForHashedIDs struct {
	HashedUserIDs []string
	Since         string
}

// FindEventsQueryByEventIDs requests all events that match the given list of
// identifiers.
type FindEventsQueryByEventIDs []string

// FindEventsQueryExclusion requests all events of the given identifiers
// that do not have a hashed user id contained in the given set.
type FindEventsQueryExclusion struct {
	EventIDs      []string
	HashedUserIDs []string
}

// DeleteEventsQueryByHashedIDs requests deletion of all events that match
// the given identifiers.
type DeleteEventsQueryByHashedIDs []string

// DeleteEventsQueryOlderThan requests deletion of all events that are older than
// the given ULID event identifier.
type DeleteEventsQueryOlderThan string

// DeleteEventsQueryByEventIDs requests deletion of all events contained in the
// given set.
type DeleteEventsQueryByEventIDs []string

// DeleteUserQueryByHashedID requests deletion of the user record with the given
// hashed id.
type DeleteUserQueryByHashedID string

// FindUserQueryByHashedUserID requests the user of the given ID
type FindUserQueryByHashedUserID string

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

// FindAccountUserQueryByHashedEmail requests the account user with the given
// hashed email.
type FindAccountUserQueryByHashedEmail string

// FindAccountUserQueryByHashedEmailIncludeRelationships requests the account user with the given
// hashed email and all of its relationships.
type FindAccountUserQueryByHashedEmailIncludeRelationships string

// FindAccountUserQueryByUserIDIncludeRelationships requests the account user of
// the given id and all of its relationships.
type FindAccountUserQueryByUserIDIncludeRelationships string

// FindAccountUserRelationShipsQueryByUserID requests all relationships for the user
// with the given user ID.
type FindAccountUserRelationShipsQueryByUserID string

// Transaction is a data access layer that does not persist data until commit
// is called. In case rollback is called before, the underlying database will
// remain in the same state as before.
type Transaction interface {
	DataAccessLayer
	Rollback() error
	Commit() error
}
