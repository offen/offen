package persistence

import (
	"time"
)

// Service is a backend-agnostic wrapper for interacting with a persistence
// layer. It does not make any assumptions about how data is being modelled
// and stored.
type Service interface {
	Insert(userID, accountID, payload string) error
	Query(Query) (map[string][]EventResult, error)
	GetAccount(accountID string, events bool, eventsSince string) (AccountResult, error)
	CreateAccount(name, creatorEmailAddress, creatorPassword string) error
	RetireAccount(accountID string) error
	GetDeletedEvents(ids []string, userID string) ([]string, error)
	AssociateUserSecret(accountID, userID, encryptedUserSecret string) error
	Purge(userID string) error
	Login(email, password string) (LoginResult, error)
	LookupAccountUser(userID string) (LoginResult, error)
	ChangePassword(userID, currentPassword, changedPassword string) error
	ChangeEmail(userID, emailAddress, password string) error
	GenerateOneTimeKey(emailAddress string) ([]byte, error)
	ResetPassword(emailAddress, password string, oneTimeKey []byte) error
	InviteUser(inviteeEmailAddress, providerEmailAddress, providerPassword, accountID string) (InviteUserResult, error)
	Join(emailAddress, password string) error
	Expire(retention time.Duration) (int, error)
	Bootstrap(data BootstrapConfig) error
	ProbeEmpty() bool
	CheckHealth() error
	Migrate() error
}

type persistenceLayer struct {
	dal DataAccessLayer
}

// New creates a persistence service that connects to any database using
// the given access layer.
func New(dal DataAccessLayer, configs ...Config) (Service, error) {
	db := persistenceLayer{dal: dal}
	for _, config := range configs {
		config(&db)
	}
	return &db, nil
}

// Config is a function that adds a configuration option to the constructor
type Config func(*persistenceLayer)
