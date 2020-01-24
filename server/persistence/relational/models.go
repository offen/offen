package relational

import (
	"time"

	"github.com/offen/offen/server/persistence"
)

// Event is any analytics event that will be stored in the database. It is
// uniquely tied to an Account and a User model.
type Event struct {
	EventID   string `gorm:"primary_key"`
	AccountID string
	// the secret id is nullable for anonymous events
	SecretID *string
	Payload  string
	Secret   Secret `gorm:"foreignkey:SecretID;association_foreignkey:SecretID"`
}

func (e *Event) export() persistence.Event {
	return persistence.Event{
		EventID:   e.EventID,
		AccountID: e.AccountID,
		SecretID:  e.SecretID,
		Payload:   e.Payload,
		Secret:    e.Secret.export(),
	}
}

func importEvent(e *persistence.Event) Event {
	return Event{
		EventID:   e.EventID,
		AccountID: e.AccountID,
		SecretID:  e.SecretID,
		Payload:   e.Payload,
		Secret:    importSecret(&e.Secret),
	}
}

// Secret associates a hashed user id - which ties a user and account together
// uniquely - with the encrypted user secret the account owner can use
// to decrypt events stored for that user.
type Secret struct {
	SecretID        string `gorm:"primary_key"`
	EncryptedSecret string
}

func (s *Secret) export() persistence.Secret {
	return persistence.Secret{
		SecretID:        s.SecretID,
		EncryptedSecret: s.EncryptedSecret,
	}
}

func importSecret(s *persistence.Secret) Secret {
	return Secret{
		SecretID:        s.SecretID,
		EncryptedSecret: s.EncryptedSecret,
	}
}

// AccountUser is a person that can log in and access data related to all
// associated accounts.
type AccountUser struct {
	AccountUserID  string `gorm:"primary_key"`
	HashedEmail    string
	HashedPassword string
	Salt           string
	Relationships  []AccountUserRelationship `gorm:"foreignkey:AccountUserID;association_foreignkey:AccountUserID"`
}

func (a *AccountUser) export() persistence.AccountUser {
	var relationships []persistence.AccountUserRelationship
	for _, r := range a.Relationships {
		relationships = append(relationships, r.export())
	}
	return persistence.AccountUser{
		AccountUserID:  a.AccountUserID,
		HashedEmail:    a.HashedEmail,
		HashedPassword: a.HashedPassword,
		Salt:           a.Salt,
		Relationships:  relationships,
	}
}

func importAccountUser(a *persistence.AccountUser) AccountUser {
	var relationships []AccountUserRelationship
	for _, r := range a.Relationships {
		relationships = append(relationships, importAccountUserRelationship(&r))
	}
	return AccountUser{
		AccountUserID:  a.AccountUserID,
		HashedEmail:    a.HashedEmail,
		HashedPassword: a.HashedPassword,
		Salt:           a.Salt,
		Relationships:  relationships,
	}
}

// AccountUserRelationship contains the encrypted KeyEncryptionKeys needed for
// an AccountUser to access the data of the account it links to.
type AccountUserRelationship struct {
	RelationshipID                    string `gorm:"primary_key"`
	AccountUserID                     string
	AccountID                         string
	PasswordEncryptedKeyEncryptionKey string
	EmailEncryptedKeyEncryptionKey    string
	OneTimeEncryptedKeyEncryptionKey  string
}

func (a *AccountUserRelationship) export() persistence.AccountUserRelationship {
	return persistence.AccountUserRelationship{
		RelationshipID:                    a.RelationshipID,
		AccountUserID:                     a.AccountUserID,
		AccountID:                         a.AccountID,
		PasswordEncryptedKeyEncryptionKey: a.PasswordEncryptedKeyEncryptionKey,
		EmailEncryptedKeyEncryptionKey:    a.EmailEncryptedKeyEncryptionKey,
		OneTimeEncryptedKeyEncryptionKey:  a.OneTimeEncryptedKeyEncryptionKey,
	}
}

func importAccountUserRelationship(a *persistence.AccountUserRelationship) AccountUserRelationship {
	return AccountUserRelationship{
		RelationshipID:                    a.RelationshipID,
		AccountUserID:                     a.AccountUserID,
		AccountID:                         a.AccountID,
		PasswordEncryptedKeyEncryptionKey: a.PasswordEncryptedKeyEncryptionKey,
		EmailEncryptedKeyEncryptionKey:    a.EmailEncryptedKeyEncryptionKey,
		OneTimeEncryptedKeyEncryptionKey:  a.OneTimeEncryptedKeyEncryptionKey,
	}
}

// Account stores information about an account.
type Account struct {
	AccountID           string `gorm:"primary_key"`
	Name                string
	PublicKey           string
	EncryptedPrivateKey string
	UserSalt            string
	Retired             bool
	Created             time.Time
	Events              []Event `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
}

func (a *Account) export() persistence.Account {
	var events []persistence.Event
	for _, e := range a.Events {
		events = append(events, e.export())
	}
	return persistence.Account{
		AccountID:           a.AccountID,
		Name:                a.Name,
		PublicKey:           a.PublicKey,
		EncryptedPrivateKey: a.EncryptedPrivateKey,
		UserSalt:            a.UserSalt,
		Retired:             a.Retired,
		Created:             a.Created,
		Events:              events,
	}
}

func importAccount(a *persistence.Account) Account {
	events := []Event{}
	for _, e := range a.Events {
		events = append(events, importEvent(&e))
	}
	return Account{
		AccountID:           a.AccountID,
		Name:                a.Name,
		PublicKey:           a.PublicKey,
		EncryptedPrivateKey: a.EncryptedPrivateKey,
		UserSalt:            a.UserSalt,
		Retired:             a.Retired,
		Created:             a.Created,
		Events:              events,
	}
}
