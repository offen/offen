package persistence

import "time"

// SecretResult contains information about a single secret record
type SecretResult struct {
	SecretID        string `json:"secretId"`
	EncryptedSecret string `json:"encryptedSecret"`
}

// EventResult is an element returned from a query. It contains all data that
// is stored about an atomic event.
type EventResult struct {
	AccountID string  `json:"accountId"`
	SecretID  *string `json:"secretId"`
	EventID   string  `json:"eventId"`
	Payload   string  `json:"payload"`
}

// EventsByAccountID groups a list of events by AccountID in a response
type EventsByAccountID map[string][]EventResult

// EncryptedSecretsByID is a map of secret IDs and their respective
// encrypted user secrets
type EncryptedSecretsByID map[string]string

// AccountResult is the data returned from looking up an account by id
type AccountResult struct {
	AccountID           string                `json:"accountId"`
	Name                string                `json:"name"`
	PublicKey           interface{}           `json:"publicKey,omitempty"`
	EncryptedPrivateKey string                `json:"encryptedPrivateKey,omitempty"`
	Events              *EventsByAccountID    `json:"events,omitempty"`
	Secrets             *EncryptedSecretsByID `json:"encryptedSecrets,omitempty"`
	Created             time.Time             `json:"created,omitempty"`
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
	Created          time.Time   `json:"created"`
}
