package persistence

// Database is anything that can be used to store and query event data
type Database interface {
	Insert(userID, accountID, payload string) error
	Query(Query) (map[string][]EventResult, error)
	GetAccount(accountID string, events bool, eventsSince string) (AccountResult, error)
	CreateAccount(accountID, name string) error
	GetDeletedEvents(ids []string, userID string) ([]string, error)
	AssociateUserSecret(accountID, userID, encryptedUserSecret string) error
	Purge(userID string) error
}

// Query defines a set of filters to limit the set of results to be returned
// In case a field has the zero value, its filter will not be applied.
type Query interface {
	AccountIDs() []string
	UserID() string
	Since() string
}

type UserResult struct {
	HashedUserID        string `json:"hashedUserId"`
	EncryptedUserSecret string `json:"encryptedUserSecret"`
}

// EventResult is an element returned from a query. It contains all data that
// is stored about an atomic event.
type EventResult struct {
	AccountID string  `json:"accountId"`
	UserID    *string `json:"userId"`
	EventID   string  `json:"eventId"`
	Payload   string  `json:"payload"`
}

// EventsByAccountID groups a list of events by AccountID in a response
type EventsByAccountID map[string][]EventResult

// SecretsByUserID is a map of hashed user IDs and their respective
// encrypted user secrets
type SecretsByUserID map[string]string

// AccountResult is the data returned from looking up an account by id
type AccountResult struct {
	Name               string             `json:"name"`
	AccountID          string             `json:"accountId"`
	PublicKey          interface{}        `json:"publicKey"`
	EncryptedSecretKey string             `json:"encryptedPrivateKey,omitempty"`
	Events             *EventsByAccountID `json:"events,omitempty"`
	UserSecrets        *SecretsByUserID   `json:"userSecrets,omitempty"`
}
