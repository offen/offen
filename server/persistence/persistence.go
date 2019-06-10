package persistence

// Database is anything that can be used to store and query event data
type Database interface {
	Insert(userID, accountID, payload string) error
	Query(Query) (map[string][]EventResult, error)
	GetAccount(accountID string, events bool) (AccountResult, error)
	AssociateUserSecret(accountID, userID, encryptedUserSecret string) error
}

// Query defines a set of filters to limit the set of results to be returned
// In case a field has the zero value, its filter will not be applied.
type Query interface {
	AccountIDs() []string
	UserID() string
	Since() string
}

type UserResult struct {
	HashedUserID        string `json:"hashed_user_id"`
	EncryptedUserSecret string `json:"encrypted_user_secret"`
}

// EventResult is an element returned from a query. It contains all data that
// is stored about an atomic event.
type EventResult struct {
	UserID  string `json:"user_id"`
	EventID string `json:"event_id"`
	Payload string `json:"payload"`
}

// EventsByAccountID groups a list of events by AccountID in a response
type EventsByAccountID map[string][]EventResult

// SecretsByUserID is a map of hashed user IDs and their respective
// encrypted user secrets
type SecretsByUserID map[string]string

// AccountResult is the data returned from looking up an account by id
type AccountResult struct {
	Name               string             `json:"name"`
	AccountID          string             `json:"account_id"`
	PublicKey          interface{}        `json:"public_key"`
	EncryptedSecretKey string             `json:"encrypted_private_key,omitempty"`
	Events             *EventsByAccountID `json:"events,omitempty"`
	UserSecrets        *SecretsByUserID   `json:"user_secrets,omitempty"`
}
