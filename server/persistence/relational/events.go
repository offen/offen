package relational

import (
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) Insert(userID, accountID, payload string) error {
	eventID, err := newEventID()
	if err != nil {
		return fmt.Errorf("relational: error creating event identifier: %v", err)
	}

	var account Account
	err = r.db.Where(`account_id = ? AND retired = ?`, accountID, false).First(&account).Error
	if err != nil {
		if gorm.IsRecordNotFoundError(err) {
			return persistence.ErrUnknownAccount(
				fmt.Sprintf("unknown or retired account with id %s", accountID),
			)
		}
		return fmt.Errorf("relational: error looking up account with id %s: %v", accountID, err)
	}

	var hashedUserID *string
	if userID != "" {
		hash := account.HashUserID(userID)
		hashedUserID = &hash
	}

	// in case the event is not anonymous, we need to check that the user
	// already exists for the account so events can be decrypted lateron
	if hashedUserID != nil {
		var user User
		if err := r.db.Where("hashed_user_id = ?", hashedUserID).First(&user).Error; gorm.IsRecordNotFoundError(err) {
			return persistence.ErrUnknownUser(
				fmt.Sprintf("relational: unknown user with id %s", userID),
			)
		}
	}

	r.db.Create(&Event{
		AccountID:    accountID,
		HashedUserID: hashedUserID,
		Payload:      payload,
		EventID:      eventID,
	})
	return nil
}

func (r *relationalDatabase) Query(query persistence.Query) (map[string][]persistence.EventResult, error) {
	var result []Event
	out := map[string][]persistence.EventResult{}

	var accounts []Account
	if err := r.db.Find(&accounts).Error; err != nil {
		return nil, fmt.Errorf("relational: error looking up all accounts: %v", err)
	}

	userID := query.UserID()
	hashedUserIDs := hashUserIDForAccounts(userID, accounts)

	var eventConditions []interface{}
	if query.Since() != "" {
		eventConditions = []interface{}{
			"event_id > ? AND hashed_user_id in (?)",
			query.Since(),
			hashedUserIDs,
		}
	} else {
		eventConditions = []interface{}{"hashed_user_id in (?)", hashedUserIDs}
	}

	if err := r.db.Find(&result, eventConditions...).Error; err != nil {
		return nil, fmt.Errorf("relational: error looking up events: %v", err)
	}

	for _, match := range result {
		out[match.AccountID] = append(out[match.AccountID], persistence.EventResult{
			AccountID: match.AccountID,
			UserID:    match.HashedUserID,
			Payload:   match.Payload,
			EventID:   match.EventID,
		})
	}
	return out, nil
}

func (r *relationalDatabase) Purge(userID string) error {
	var accounts []Account
	if err := r.db.Find(&accounts).Error; err != nil {
		return fmt.Errorf("relational: error looking up all accounts: %v", err)
	}
	hashedUserIDs := hashUserIDForAccounts(userID, accounts)

	if err := r.db.Where("hashed_user_id IN (?)", hashedUserIDs).Delete(Event{}).Error; err != nil {
		return fmt.Errorf("relational: error purging events: %v", err)
	}
	return nil
}

func (r *relationalDatabase) GetDeletedEvents(ids []string, userID string) ([]string, error) {
	// First, perform a check which one of the events have been deleted
	var existing []Event
	if err := r.db.Where("event_id IN (?)", ids).Find(&existing).Error; err != nil {
		return nil, fmt.Errorf("relational: error looking up events: %v", err)
	}

	deletedIds := []string{}
outer:
	for _, id := range ids {
		for _, ev := range existing {
			if id == ev.EventID {
				continue outer
			}
		}
		deletedIds = append(deletedIds, id)
	}

	// The user might have changed their identifier and might know about events
	// associated to previous values, so the next check looks up events that
	// are still present but considered "foreign"
	if userID != "" {
		var accounts []Account
		if err := r.db.Find(&accounts).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up all accounts: %v", err)
		}

		hashedUserIDs := hashUserIDForAccounts(userID, accounts)
		var foreign []Event
		if err := r.db.Where("event_id IN (?) AND hashed_user_id NOT IN (?)", ids, hashedUserIDs).Find(&foreign).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up foreign events: %v", err)
		}

		for _, evt := range foreign {
			deletedIds = append(deletedIds, evt.EventID)
		}
	}

	return deletedIds, nil
}

func hashUserIDForAccounts(userID string, accounts []Account) []string {
	if len(accounts) == 0 {
		return []string{}
	}
	hashes := make(chan string)
	// in case a user queries for a longer list of account ids (or even all of them)
	// hashing the user ID against all salts can get relatively expensive, so
	// computation is being done concurrently
	for _, account := range accounts {
		go func(account Account) {
			hash := account.HashUserID(userID)
			hashes <- hash
		}(account)
	}

	var hashedUserIDs []string
	for result := range hashes {
		hashedUserIDs = append(hashedUserIDs, result)
		if len(hashedUserIDs) == len(accounts) {
			close(hashes)
			break
		}
	}
	return hashedUserIDs
}
