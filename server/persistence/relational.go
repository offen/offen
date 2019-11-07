package persistence

import (
	"errors"
	"fmt"

	"github.com/jinzhu/gorm"
	// GORM imports the dialects for side effects only
	_ "github.com/jinzhu/gorm/dialects/mysql"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	gormigrate "gopkg.in/gormigrate.v1"
)

type relationalDAL struct {
	db *gorm.DB
}

// NewRelationalDAL wraps the given *gorm.DB, exposing the default
// interface for data access layers.
func NewRelationalDAL(db *gorm.DB) DataAccessLayer {
	return &relationalDAL{
		db: db,
	}
}

func (r *relationalDAL) Transaction() (Transaction, error) {
	txn := r.db.Begin()
	if err := txn.Error; err != nil {
		return nil, fmt.Errorf("dal: begun transaction in error state: %w", err)
	}
	dal := relationalDAL{txn}
	return &transaction{&dal}, nil
}

func (r *relationalDAL) CreateEvent(e *Event) error {
	if err := r.db.Create(e).Error; err != nil {
		return fmt.Errorf("dal: error creating event: %w", err)
	}
	return nil
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

func (r *relationalDAL) DeleteEvents(q interface{}) (int64, error) {
	switch query := q.(type) {
	case DeleteEventsQueryByEventIDs:
		deletion := r.db.Where("event_id in (?)", []string(query)).Delete(Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("relational: error deleting orphaned events: %w", err)
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

func (r *relationalDAL) CreateAccount(a *Account) error {
	if err := r.db.Create(a).Error; err != nil {
		return fmt.Errorf("dal: error creating account")
	}
	return nil
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

func (r *relationalDAL) CreateAccountUser(u *AccountUser) error {
	if err := r.db.Create(u).Error; err != nil {
		return fmt.Errorf("dal: error creating account user: %w", err)
	}
	return nil
}

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

func (r *relationalDAL) CreateAccountUserRelationship(a *AccountUserRelationship) error {
	if err := r.db.Create(a).Error; err != nil {
		return fmt.Errorf("dal: error creating account user relationship: %w", err)
	}
	return nil
}

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

func (r *relationalDAL) DropAll() error {
	if err := r.db.Delete(&Event{}).Error; err != nil {
		return fmt.Errorf("dal: error dropping events table: %w,", err)
	}
	if err := r.db.Delete(&Account{}).Error; err != nil {
		return fmt.Errorf("dal: error dropping accounts table: %w,", err)
	}
	if err := r.db.Delete(&User{}).Error; err != nil {
		return fmt.Errorf("dal: error dropping user table: %w,", err)
	}
	if err := r.db.Delete(&AccountUser{}).Error; err != nil {
		return fmt.Errorf("dal: error dropping account user table: %w,", err)
	}
	if err := r.db.Delete(&AccountUserRelationship{}).Error; err != nil {
		return fmt.Errorf("dal: error dropping account user relationship table: %w,", err)
	}
	return nil
}

type transaction struct {
	*relationalDAL
}

func (t *transaction) Rollback() error {
	if err := t.db.Rollback().Error; err != nil {
		return fmt.Errorf("dal: error rolling back transaction: %w", err)
	}
	return nil
}

func (t *transaction) Commit() error {
	if err := t.db.Commit().Error; err != nil {
		return fmt.Errorf("dal: error committing transaction: %w", err)
	}
	return nil
}

func (t *transaction) Transaction() (Transaction, error) {
	return nil, errors.New("dal: cannot call transaction on a transaction")
}

func (t *transaction) Ping() error {
	return errors.New("dal: cannot call ping on a transaction")
}

func (t *transaction) ApplyMigrations() error {
	return errors.New("dal: cannot apply migrations on a transaction")
}
