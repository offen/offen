package persistence

import (
	"time"
)

// Database is a backend-agnostic wrapper for interacting with a persistence
// layer. It does not make any assumptions about how data is being modelled
// and stored.
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
	GenerateOneTimeKey(emailAddress string) ([]byte, error)
	ResetPassword(emailAddress, password string, oneTimeKey []byte) error
	Expire(retention time.Duration) (int, error)
	Bootstrap(data BootstrapConfig, salt []byte) error
	CheckHealth() error
	Migrate() error
}

type relationalDatabase struct {
	db        DataAccessLayer
	emailSalt []byte
}

// New creates a persistence layer that connects to a PostgreSQL database
func New(dal DataAccessLayer, configs ...Config) (Database, error) {
	db := relationalDatabase{db: dal}
	for _, config := range configs {
		config(&db)
	}
	return &db, nil
}

// Config is a function that adds a configuration option to the constructor
type Config func(*relationalDatabase)

// WithEmailSalt sets the salt value that is used for hashing email addresses
func WithEmailSalt(b []byte) Config {
	return func(r *relationalDatabase) {
		r.emailSalt = b
	}
}
