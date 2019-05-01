package persistence

import "github.com/mendsley/gojwk"

// Database is anything that can be used to store and query event data
type Database interface {
	Insert(userID, accountID, payload string) error
	Query(Query) ([]EventResult, error)
	GetAccount(accountID string) (AccountResult, error)
	AssociateUserSecret(accountID, userID, encryptedUserSecret string) error
}

// Query defines a set of filters to limit the set of results to be returned
// In case a field has the zero value, its filter will not be applied.
type Query interface {
	AccountIDs() []string
	UserID() string
	Since() string
}

// EventResult is an element returned from a query. It contains all data that
// is stored about an atomic event.
type EventResult struct {
	AccountID string `json:"account_id"`
	UserID    string `json:"user_id"`
	EventID   string `json:"event_id"`
	Payload   string `json:"payload"`
}

// AccountResult is the data returned from looking up an account by id
type AccountResult struct {
	AccountID string    `json:"account_id"`
	PublicKey gojwk.Key `json:"public_key"`
}
