package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) createEvent(e *Event) error {
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

// Query implements DatabaseQuery.
func (f FindEventsQueryForHashedIDs) Query() {}

// FindEventsQueryByEventIDs requests all events that match the given list of
// identifiers.
type FindEventsQueryByEventIDs []string

// Query implements DatabaseQuery.
func (f FindEventsQueryByEventIDs) Query() {}

// FindEventsQueryExclusion requests all events of the given identifiers
// that do not have a hashed user id contained in the given set.
type FindEventsQueryExclusion struct {
	EventIDs      []string
	HashedUserIDs []string
}

// Query implements DatabaseQuery.
func (f FindEventsQueryExclusion) Query() {}

func (r *relationalDatabase) findEvents(q persistence.DatabaseQuery) ([]Event, error) {
	switch query := q.(type) {
	case FindEventsQueryForHashedIDs:
		var events []Event
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
		var events []Event
		if err := r.db.Where("event_id IN (?)", []string(query)).Find(&events).Error; err != nil {
			return nil, fmt.Errorf("dal: error looking up events: %w", err)
		}
		return events, nil
	case FindEventsQueryExclusion:
		var events []Event
		if err := r.db.Where("event_id IN (?) AND hashed_user_id NOT IN (?)", query.EventIDs, query.HashedUserIDs).Find(&events).Error; err != nil {
			return nil, fmt.Errorf("dal: error looking up events: %w", err)
		}
		return events, nil
	default:
		return nil, ErrBadQuery
	}
}

// DeleteEventsQueryByHashedIDs requests deletion of all events that match
// the given identifiers.
type DeleteEventsQueryByHashedIDs []string

// Query implements DatabaseQuery
func (d DeleteEventsQueryByHashedIDs) Query() {}

func (r *relationalDatabase) deleteEvents(q persistence.DatabaseQuery) error {
	switch query := q.(type) {
	case DeleteEventsQueryByHashedIDs:
		if err := r.db.Where("hashed_user_id IN (?)", []string(query)).Delete(Event{}).Error; err != nil {
			return fmt.Errorf("dal: error deleting events: %w", err)
		}
		return nil
	default:
		return ErrBadQuery
	}
}

// FindUserQueryByHashedUserID requests the user of the given ID
type FindUserQueryByHashedUserID string

// Query implements DatabaseQuery
func (f FindUserQueryByHashedUserID) Query() {}

func (r *relationalDatabase) findUser(query persistence.DatabaseQuery) (User, error) {
	switch q := query.(type) {
	case FindUserQueryByHashedUserID:
		var user User
		if err := r.db.Where("hashed_user_id = ?", string(q)).First(&user).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return user, persistence.ErrUnknownUser("dal: no matching user found")
			}
			return user, fmt.Errorf("dal: error looking up user: %w", err)
		}
		return user, nil
	default:
		return User{}, ErrBadQuery
	}
}

// FindAccountQueryActiveByID requests a non-retired account of the given ID
type FindAccountQueryActiveByID string

// Query implements DatabaseQuery
func (f FindAccountQueryActiveByID) Query() {}

func (r *relationalDatabase) findAccount(q persistence.DatabaseQuery) (Account, error) {
	switch query := q.(type) {
	case FindAccountQueryActiveByID:
		var account Account
		if err := r.db.Where("account_id = ? AND retired = ?", string(query), false).First(&account).Error; err != nil {
			if gorm.IsRecordNotFoundError(err) {
				return account, persistence.ErrUnknownAccount("dal: no matching account found")
			}
			return account, fmt.Errorf("dal: error looking up account: %w", err)
		}
		return account, nil
	default:
		return Account{}, ErrBadQuery
	}
}

type FindAccountsQueryAllAccounts struct{}

func (f FindAccountsQueryAllAccounts) Query() {}

func (r *relationalDatabase) findAccounts(q persistence.DatabaseQuery) ([]Account, error) {
	switch q.(type) {
	case FindAccountsQueryAllAccounts:
		var accounts []Account
		if err := r.db.Find(&accounts).Error; err != nil {
			return nil, fmt.Errorf("dal: error looking up all accounts: %w", err)
		}
		return accounts, nil
	default:
		return nil, ErrBadQuery
	}
}
