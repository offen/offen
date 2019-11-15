package persistence

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

// LoginResult is a successful account user authentication response.
type LoginResult struct {
	UserID   string               `json:"userId"`
	Accounts []LoginAccountResult `json:"accounts"`
}

// CanAccessAccount checks whether the login result is allowed to access the
// account of the given identifier.
func (l *LoginResult) CanAccessAccount(accountID string) bool {
	for _, account := range l.Accounts {
		if accountID == account.AccountID {
			return true
		}
	}
	return false
}

// LoginAccountResult contains information for the client to handle an account
// in the client at runtime.
type LoginAccountResult struct {
	AccountName      string      `json:"accountName"`
	AccountID        string      `json:"accountId"`
	KeyEncryptionKey interface{} `json:"keyEncryptionKey"`
}
