package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
)

func (r *relationalDatabase) Insert(userID, accountID, payload string) error {
	eventID, err := newEventID()
	if err != nil {
		return fmt.Errorf("persistence: error creating new event identifier: %w", err)
	}

	account, err := r.findAccount(FindAccountQueryActiveByID(accountID))
	if err != nil {
		return fmt.Errorf("persistence: error looking up matching account for given event: %w", err)
	}

	var hashedUserID *string
	if userID != "" {
		hash := account.HashUserID(userID)
		hashedUserID = &hash
	}

	// in case the event is not anonymous, we need to check that the user
	// already exists for the account so events can be decrypted lateron
	if hashedUserID != nil {
		if _, err := r.findUser(FindUserQueryByHashedUserID(*hashedUserID)); err != nil {
			return fmt.Errorf("persistence: error finding user for given event: %w", err)
		}
	}

	insertErr := r.createEvent(&Event{
		AccountID:    accountID,
		HashedUserID: hashedUserID,
		Payload:      payload,
		EventID:      eventID,
	})
	if insertErr != nil {
		return fmt.Errorf("persistence: error inserting event: %w", insertErr)
	}
	return nil
}

func (r *relationalDatabase) Query(query persistence.Query) (map[string][]persistence.EventResult, error) {
	var accounts []Account
	accounts, err := r.findAccounts(FindAccountsQueryAllAccounts{})
	if err != nil {
		return nil, fmt.Errorf("persistence: error looking up all accounts: %v", err)
	}

	results, err := r.findEvents(FindEventsQueryForHashedIDs{
		HashedUserIDs: hashUserIDForAccounts(query.UserID(), accounts),
		Since:         query.Since(),
	})
	if err != nil {
		return nil, fmt.Errorf("persistence: error looking up events: %w", err)
	}

	// results will be keyed on account ids
	out := map[string][]persistence.EventResult{}
	for _, match := range results {
		out[match.AccountID] = append(out[match.AccountID], persistence.EventResult{
			AccountID: match.AccountID,
			Payload:   match.Payload,
			EventID:   match.EventID,
		})
	}
	return out, nil
}

func (r *relationalDatabase) Purge(userID string) error {
	accounts, err := r.findAccounts(FindAccountsQueryAllAccounts{})
	if err != nil {
		return fmt.Errorf("relational: error retrieving available accounts: %w", err)
	}

	hashedUserIDs := hashUserIDForAccounts(userID, accounts)
	if err := r.deleteEvents(DeleteEventsQueryByHashedIDs(hashedUserIDs)); err != nil {
		return fmt.Errorf("persistence: error purging events: %w", err)
	}
	return nil
}

func (r *relationalDatabase) GetDeletedEvents(ids []string, userID string) ([]string, error) {
	// First, perform a check which one of the events have been deleted
	existing, err := r.findEvents(FindEventsQueryByEventIDs(ids))
	if err != nil {
		return nil, fmt.Errorf("persistence: error looking up events: %w", err)
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
		accounts, err := r.findAccounts(FindAccountsQueryAllAccounts{})
		if err != nil {
			return nil, fmt.Errorf("persistence: error looking up all accounts: %v", err)
		}

		foreign, err := r.findEvents(FindEventsQueryExclusion{
			EventIDs:      ids,
			HashedUserIDs: hashUserIDForAccounts(userID, accounts),
		})
		if err != nil {
			return nil, fmt.Errorf("persistence: error looking up foreign events: %v", err)
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
