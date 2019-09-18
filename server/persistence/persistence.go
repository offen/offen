package persistence

// Database is anything that can be used to store and query event data
type Database interface {
	Insert(userID, accountID, payload string) error
	Query(Query) (map[string][]EventResult, error)
	GetAccount(accountID string, events bool, eventsSince string) (AccountResult, error)
	GetDeletedEvents(ids []string, userID string) ([]string, error)
	AssociateUserSecret(accountID, userID, encryptedUserSecret string) error
	Purge(userID string) error
	Login(email, password string) (LoginResult, error)
	LookupUser(userID string) (LoginResult, error)
	ChangePassword(userID, currentPassword, changedPassword string) error
	ChangeEmail(userID, emailAddress, password string) error
	CheckHealth() error
}

// Query defines a set of filters to limit the set of results to be returned
// In case a field has the zero value, its filter will not be applied.
type Query interface {
	AccountIDs() []string
	UserID() string
	Since() string
}

// UserResult contains information about a single user entry
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
	AccountID           string             `json:"accountId"`
	Name                string             `json:"name"`
	PublicKey           interface{}        `json:"publicKey,omitempty"`
	EncryptedPrivateKey string             `json:"encryptedPrivateKey,omitempty"`
	Events              *EventsByAccountID `json:"events,omitempty"`
	UserSecrets         *SecretsByUserID   `json:"userSecrets,omitempty"`
}

type LoginResult struct {
	UserID   string               `json:"userId"`
	Accounts []LoginAccountResult `json:"accounts"`
}

func (l *LoginResult) CanAccessAccount(accountID string) bool {
	for _, account := range l.Accounts {
		if accountID == account.AccountID {
			return true
		}
	}
	return false
}

type LoginAccountResult struct {
	AccountName      string      `json:"accountName"`
	AccountID        string      `json:"accountId"`
	KeyEncryptionKey interface{} `json:"keyEncryptionKey"`
}
