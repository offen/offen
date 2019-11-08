package relational

import (
	"github.com/offen/offen/server/persistence"
)

// Event is any analytics event that will be stored in the database. It is
// uniquely tied to an Account and a User model.
type Event struct {
	EventID   string `gorm:"primary_key"`
	AccountID string
	// the user id is nullable for anonymous events
	HashedUserID *string
	Payload      string
	User         User `gorm:"foreignkey:HashedUserID;association_foreignkey:HashedUserID"`
}

func (e *Event) export() persistence.Event {
	return persistence.Event{
		EventID:      e.EventID,
		AccountID:    e.AccountID,
		HashedUserID: e.HashedUserID,
		Payload:      e.Payload,
		User:         e.User.export(),
	}
}

func importEvent(e *persistence.Event) Event {
	return Event{
		EventID:      e.EventID,
		AccountID:    e.AccountID,
		HashedUserID: e.HashedUserID,
		Payload:      e.Payload,
		User:         importUser(&e.User),
	}
}

// User associates a hashed user id - which ties a user and account together
// uniquely - with the encrypted user secret the account owner can use
// to decrypt events stored for that user.
type User struct {
	HashedUserID        string `gorm:"primary_key"`
	EncryptedUserSecret string
}

func (u *User) export() persistence.User {
	return persistence.User{
		HashedUserID:        u.HashedUserID,
		EncryptedUserSecret: u.EncryptedUserSecret,
	}
}

func importUser(u *persistence.User) User {
	return User{
		HashedUserID:        u.HashedUserID,
		EncryptedUserSecret: u.EncryptedUserSecret,
	}
}

// AccountUser is a person that can log in and access data related to all
// associated accounts.
type AccountUser struct {
	UserID         string `gorm:"primary_key"`
	HashedEmail    string
	HashedPassword string
	Salt           string
	Relationships  []AccountUserRelationship `gorm:"foreignkey:UserID;association_foreignkey:UserID"`
}

func (a *AccountUser) export() persistence.AccountUser {
	relationships := []persistence.AccountUserRelationship{}
	for _, r := range a.Relationships {
		relationships = append(relationships, r.export())
	}
	return persistence.AccountUser{
		UserID:         a.UserID,
		HashedEmail:    a.HashedEmail,
		HashedPassword: a.HashedPassword,
		Salt:           a.Salt,
		Relationships:  relationships,
	}
}

func importAccountUser(a *persistence.AccountUser) AccountUser {
	relationships := []AccountUserRelationship{}
	for _, r := range a.Relationships {
		relationships = append(relationships, importAccountUserRelationship(&r))
	}
	return AccountUser{
		UserID:         a.UserID,
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
	UserID                            string
	AccountID                         string
	PasswordEncryptedKeyEncryptionKey string
	EmailEncryptedKeyEncryptionKey    string
	OneTimeEncryptedKeyEncryptionKey  string
}

func (a *AccountUserRelationship) export() persistence.AccountUserRelationship {
	return persistence.AccountUserRelationship{
		RelationshipID:                    a.RelationshipID,
		UserID:                            a.UserID,
		AccountID:                         a.AccountID,
		PasswordEncryptedKeyEncryptionKey: a.PasswordEncryptedKeyEncryptionKey,
		EmailEncryptedKeyEncryptionKey:    a.EmailEncryptedKeyEncryptionKey,
		OneTimeEncryptedKeyEncryptionKey:  a.OneTimeEncryptedKeyEncryptionKey,
	}
}

func importAccountUserRelationship(a *persistence.AccountUserRelationship) AccountUserRelationship {
	return AccountUserRelationship{
		RelationshipID:                    a.RelationshipID,
		UserID:                            a.UserID,
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
	Events              []Event `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
}

func (a *Account) export() persistence.Account {
	events := []persistence.Event{}
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
		Events:              events,
	}
}
