package persistence

import (
	"fmt"

	"github.com/jinzhu/gorm"
	gormigrate "gopkg.in/gormigrate.v1"
)

type DataAccessLayer interface {
	CreateEvent(*Event) error
	FindEvents(interface{}) ([]Event, error)
	DeleteEvents(interface{}) (int64, error)
	CreateUser(*User) error
	FindUser(interface{}) (User, error)
	DeleteUser(interface{}) error
	FindAccount(interface{}) (Account, error)
	FindAccounts(interface{}) ([]Account, error)
	FindAccountUser(interface{}) (AccountUser, error)
	UpdateAccountUser(*AccountUser) error
	FindAccountUserRelationships(interface{}) ([]AccountUserRelationship, error)
	UpdateAccountUserRelationship(*AccountUserRelationship) error
	Transaction() Transaction
	ApplyMigrations() error
	Ping() error
}

type Transaction interface {
	DataAccessLayer
	Rollback() error
	Commit() error
}

type relationalDAL struct {
	db *gorm.DB
}

type transactionDAL struct {
	*relationalDAL
}

func (t *transactionDAL) Rollback() error {
	if err := t.db.Rollback().Error; err != nil {
		return fmt.Errorf("dal: error rolling back transaction: %w", err)
	}
	return nil
}

func (t *transactionDAL) Commit() error {
	if err := t.db.Commit().Error; err != nil {
		return fmt.Errorf("dal: error comitting transaction: %w", err)
	}
	return nil
}

func NewRelationalDAL(db *gorm.DB) DataAccessLayer {
	return &relationalDAL{
		db: db,
	}
}

func (r *relationalDAL) Transaction() Transaction {
	dal := relationalDAL{r.db.Begin()}
	return &transactionDAL{&dal}
}

func (r *relationalDAL) CreateEvent(e *Event) error {
	if err := r.db.Create(e).Error; err != nil {
		return fmt.Errorf("dal: error creating event: %w", err)
	}
	return nil
}

// FindEventsQueryForHashedIDs requests all events that match the list of hashed
// user identifiers. In case the Since value is non-zero it will be used to request
// only events that are newer than the given ULID.
type FindEventsQueryForHashedIDs struct {
	HashedUserIDs []string
	Since         string
}

// FindEventsQueryByEventIDs requests all events that match the given list of
// identifiers.
type FindEventsQueryByEventIDs []string

// FindEventsQueryExclusion requests all events of the given identifiers
// that do not have a hashed user id contained in the given set.
type FindEventsQueryExclusion struct {
	EventIDs      []string
	HashedUserIDs []string
}

func (r *relationalDAL) FindEvents(q interface{}) ([]Event, error) {
	var events []Event
	switch query := q.(type) {
	case FindEventsQueryForHashedIDs:
		var eventConditions []interface{}
		if query.Since != "" {
			eventConditions = []interface{}{
				"event_id > ? AND hashed_user_id in (?)",
				query.Since,
				query.HashedUserIDs,
			}
		} else {
			eventConditions = []interface{}{
				"hashed_user_id in (?)", query.HashedUserIDs,
			}
		}

		if err := r.db.Find(&events, eventConditions...).Error; err != nil {
			return nil, fmt.Errorf("default: error looking up events: %w", err)
		}
		return events, nil
	case FindEventsQueryByEventIDs:
		if err := r.db.Where("event_id IN (?)", []string(query)).Find(&events).Error; err != nil {
			return nil, fmt.Errorf("dal: error looking up events: %w", err)
		}
		return events, nil
	case FindEventsQueryExclusion:
		if err := r.db.Where(
			"event_id IN (?) AND hashed_user_id NOT IN (?)",
			query.EventIDs,
			query.HashedUserIDs,
		).Find(&events).Error; err != nil {
			return nil, fmt.Errorf("dal: error looking up events: %w", err)
		}
		return events, nil
	default:
		return events, ErrBadQuery
	}
}

// DeleteEventsQueryByHashedIDs requests deletion of all events that match
// the given identifiers.
type DeleteEventsQueryByHashedIDs []string

// DeleteEventsQueryOlderThan requests deletion of all events that are older than
// the given ULID event identifier.
type DeleteEventsQueryOlderThan string

// DeleteEventsQueryByEventIDs requests deletion of all events contained in the
// given set.
type DeleteEventsQueryByEventIDs []string

func (r *relationalDAL) DeleteEvents(q interface{}) (int64, error) {
	switch query := q.(type) {
	case DeleteEventsQueryByEventIDs:
		deletion := r.db.Where("event_id in (?)", []string(query)).Delete(Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("relational: error deleting orphaned events: %v", err)
		}
		return deletion.RowsAffected, nil
	case DeleteEventsQueryByHashedIDs:
		deletion := r.db.Where(
			"hashed_user_id IN (?)",
			[]string(query),
		).Delete(Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("dal: error deleting events: %w", err)
		}
		return deletion.RowsAffected, nil
	case DeleteEventsQueryOlderThan:
		deletion := r.db.Where("event_id < ?", string(query)).Delete(&Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("dal: error deleting events: %w", err)
		}
		return deletion.RowsAffected, nil
	default:
		return 0, ErrBadQuery
	}
}

func (r *relationalDAL) CreateUser(u *User) error {
	if err := r.db.Create(u).Error; err != nil {
		return fmt.Errorf("dal: error creating user: %w", err)
	}
	return nil
}

// DeleteUserQueryByHashedID requests deletion of the user record with the given
// hashed id.
type DeleteUserQueryByHashedID string

func (r *relationalDAL) DeleteUser(q interface{}) error {
	switch query := q.(type) {
	case DeleteUserQueryByHashedID:
		if err := r.db.Where("hashed_user_id = ?", string(query)).Delete(&User{}).Error; err != nil {
			return fmt.Errorf("dal: error deleting user: %w", err)
		}
		return nil
	default:
		return ErrBadQuery
	}
}

// FindUserQueryByHashedUserID requests the user of the given ID
type FindUserQueryByHashedUserID string

func (r *relationalDAL) FindUser(q interface{}) (User, error) {
	var user User
	switch query := q.(type) {
	case FindUserQueryByHashedUserID:
		if err := r.db.Where(
			"hashed_user_id = ?",
			string(query),
		).First(&user).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return user, ErrUnknownUser("dal: no matching user found")
			}
			return user, fmt.Errorf("dal: error looking up user: %w", err)
		}
		return user, nil
	default:
		return user, ErrBadQuery
	}
}

// FindAccountQueryActiveByID requests a non-retired account of the given ID
type FindAccountQueryActiveByID string

// FindAccountQueryByID requests the account of the given id.
type FindAccountQueryByID string

// FindAccountQueryIncludeEvents requests the account of the given id including
// all of the associated events. In case the value for Since is non-zero, only
// events newer than the given value should be considered.
type FindAccountQueryIncludeEvents struct {
	AccountID string
	Since     string
}

func (r *relationalDAL) FindAccount(q interface{}) (Account, error) {
	var account Account
	switch query := q.(type) {
	case FindAccountQueryIncludeEvents:
		queryDB := r.db
		if query.Since != "" {
			queryDB = queryDB.Preload("Events", "event_id > ?", query.Since).Preload("Events.User")
		} else {
			queryDB = queryDB.Preload("Events").Preload("Events.User")
		}

		if err := queryDB.Find(&account, "account_id = ?", query.AccountID).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account, ErrUnknownAccount(fmt.Sprintf(`dal: account id "%s" unknown`, query.AccountID))
			}
			return account, fmt.Errorf(`relational: error looking up account with id %s: %w`, query.AccountID, err)
		}
		return account, nil
	case FindAccountQueryByID:
		if err := r.db.Where("account_id = ?", string(query)).First(&account).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account, ErrUnknownAccount("dal: no matching account found")
			}
			return account, fmt.Errorf("dal: error looking up account: %w", err)
		}
		return account, nil
	case FindAccountQueryActiveByID:
		if err := r.db.Where(
			"account_id = ? AND retired = ?",
			string(query),
			false,
		).First(&account).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account, ErrUnknownAccount("dal: no matching active account found")
			}
			return account, fmt.Errorf("dal: error looking up account: %w", err)
		}
		return account, nil
	default:
		return account, ErrBadQuery
	}
}

// FindAccountsQueryAllAccounts requests all known accounts to be returned.
type FindAccountsQueryAllAccounts struct{}

func (r *relationalDAL) FindAccounts(q interface{}) ([]Account, error) {
	var accounts []Account
	switch q.(type) {
	case FindAccountsQueryAllAccounts:
		if err := r.db.Find(&accounts).Error; err != nil {
			return accounts, fmt.Errorf("dal: error looking up all accounts: %w", err)
		}
		return accounts, nil
	default:
		return accounts, ErrBadQuery
	}
}

// FindAccountUserQueryByHashedEmail requests the account user with the given
// hashed email.
type FindAccountUserQueryByHashedEmail string

// FindAccountUserQueryByHashedEmailIncludeRelationships requests the account user with the given
// hashed email and all of its relationships.
type FindAccountUserQueryByHashedEmailIncludeRelationships string

// FindAccountUserQueryByUserIDIncludeRelationships requests the account user of
// the given id and all of its relationships.
type FindAccountUserQueryByUserIDIncludeRelationships string

func (r *relationalDAL) FindAccountUser(q interface{}) (AccountUser, error) {
	var accountUser AccountUser
	switch query := q.(type) {
	case FindAccountUserQueryByHashedEmail:
		if err := r.db.Where("hashed_email = ?", string(query)).First(&accountUser).Error; err != nil {
			return accountUser, fmt.Errorf("dal: error looking up account user by hashed email: %w", err)
		}
		return accountUser, nil
	case FindAccountUserQueryByHashedEmailIncludeRelationships:
		var accountUser AccountUser
		if err := r.db.Preload("Relationships").Where("hashed_email = ?", string(query)).First(&accountUser).Error; err != nil {
			return accountUser, fmt.Errorf("dal: error looking up account user by hashed email: %w", err)
		}
		return accountUser, nil
	case FindAccountUserQueryByUserIDIncludeRelationships:
		var accountUser AccountUser
		if err := r.db.Preload("Relationships").Where("user_id = ?", string(query)).First(&accountUser).Error; err != nil {
			return accountUser, fmt.Errorf("dal: error looking up account user by user id: %w", err)
		}
		return accountUser, nil
	default:
		return accountUser, ErrBadQuery
	}
}

func (r *relationalDAL) UpdateAccountUser(u *AccountUser) error {
	if err := r.db.Save(u).Error; err != nil {
		return fmt.Errorf("dal: error updating account user: %w", err)
	}
	return nil
}

// FindAccountUserRelationShipsQueryByUserID requests all relationships for the user
// with the given user ID.
type FindAccountUserRelationShipsQueryByUserID string

func (r *relationalDAL) FindAccountUserRelationships(q interface{}) ([]AccountUserRelationship, error) {
	var relationships []AccountUserRelationship
	switch query := q.(type) {
	case FindAccountUserRelationShipsQueryByUserID:
		if err := r.db.Where("user_id = ?", string(query)).Find(&relationships).Error; err != nil {
			return relationships, fmt.Errorf("dal: error looking up account to account user relationships: %w", err)
		}
		return relationships, nil
	default:
		return relationships, ErrBadQuery
	}
}

func (r *relationalDAL) UpdateAccountUserRelationship(a *AccountUserRelationship) error {
	if err := r.db.Save(a).Error; err != nil {
		return fmt.Errorf("dal: error updating account user relationship: %w", err)
	}
	return nil
}

func (r *relationalDAL) ApplyMigrations() error {
	m := gormigrate.New(r.db, gormigrate.DefaultOptions, []*gormigrate.Migration{
		{
			ID: "001_add_one_time_keys",
			Migrate: func(db *gorm.DB) error {
				type AccountUserRelationship struct {
					RelationshipID                    string `gorm:"primary_key"`
					UserID                            string
					AccountID                         string
					PasswordEncryptedKeyEncryptionKey string
					EmailEncryptedKeyEncryptionKey    string
					// this is the field introducted in this migration
					OneTimeEncryptedKeyEncryptionKey string
				}
				return db.AutoMigrate(&AccountUserRelationship{}).Error
			},
			Rollback: func(db *gorm.DB) error {
				return db.Table("account_user_relationships").DropColumn("one_time_encrypted_key_encryption_key").Error
			},
		},
	})

	m.InitSchema(func(tx *gorm.DB) error {
		return tx.AutoMigrate(
			&Event{},
			&Account{},
			&User{},
			&AccountUser{},
			&AccountUserRelationship{},
		).Error
	})

	return m.Migrate()
}

func (r *relationalDAL) Ping() error {
	return r.db.DB().Ping()
}
