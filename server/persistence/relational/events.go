package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) Insert(userID, accountID, payload string) error {
	eventID, err := newEventID()
	if err != nil {
		return err
	}

	var account Account
	r.db.Where(`account_id = ?`, accountID).First(&account)

	if account.AccountID == "" {
		return persistence.ErrUnknownAccount(
			fmt.Sprintf("unknown account with id %s", accountID),
		)
	}

	hashedUserID := account.HashUserID(userID)

	r.db.Create(&Event{
		AccountID:    accountID,
		HashedUserID: hashedUserID,
		Payload:      payload,
		EventID:      eventID,
	})
	return nil
}

func (r *relationalDatabase) Query(query persistence.Query) ([]persistence.EventResult, error) {
	var accounts []Account
	if len(query.AccountIDs()) == 0 {
		if err := r.db.Find(&accounts).Error; err != nil {
			return nil, err
		}
	} else {
		if err := r.db.Find(&accounts, "account_id in (?)", query.AccountIDs()).Error; err != nil {
			return nil, err
		}
	}

	if len(accounts) == 0 {
		return []persistence.EventResult{}, nil
	}

	userID := query.UserID()
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

	var eventConditions []interface{}
	var result []Event
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
		return nil, err
	}

	out := []persistence.EventResult{}
	for _, match := range result {
		out = append(out, persistence.EventResult{
			AccountID: match.AccountID,
			UserID:    match.HashedUserID,
			Payload:   match.Payload,
			EventID:   match.EventID,
		})
	}
	return out, nil
}
