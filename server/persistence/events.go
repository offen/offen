// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"fmt"
	"strings"
)

func (p *persistenceLayer) Insert(userID, accountID, payload string, idOverride *string) error {
	var eventID string
	if idOverride == nil {
		var err error
		eventID, err = NewULID()
		if err != nil {
			return fmt.Errorf("persistence: error creating new event identifier: %w", err)
		}
	} else {
		eventID = *idOverride
	}

	account, err := p.dal.FindAccount(FindAccountQueryActiveByID(accountID))
	if err != nil {
		return fmt.Errorf("persistence: error looking up matching account for given event: %w", err)
	}

	var hashedUserID *string
	if userID != "" {
		hash, err := account.HashUserID(userID)
		if err != nil {
			return fmt.Errorf("persistence: error hashing user id: %w", err)
		}
		hashedUserID = &hash
	}

	// in case the event is not anonymous, we need to check that the user
	// already exists for the account so events can be decrypted lateron
	if hashedUserID != nil {
		if _, err := p.dal.FindSecret(FindSecretQueryBySecretID(*hashedUserID)); err != nil {
			return fmt.Errorf("persistence: error finding secret for given event: %w", err)
		}
	}

	sequence, seqErr := NewULID()
	if seqErr != nil {
		return fmt.Errorf("persistence: error creating sequence number: %w", seqErr)
	}

	insertErr := p.dal.CreateEvent(&Event{
		AccountID: accountID,
		SecretID:  hashedUserID,
		Payload:   payload,
		EventID:   eventID,
		Sequence:  sequence,
	})
	if insertErr != nil {
		return fmt.Errorf("persistence: error inserting event: %w", insertErr)
	}
	return nil
}

// Query defines a set of filters to limit the set of results to be returned
// In case a field has the zero value, its filter will not be applied.
type Query struct {
	UserID string
	Since  string
}

func (p *persistenceLayer) Query(query Query) (EventsResult, error) {
	var accounts []Account
	accounts, err := p.dal.FindAccounts(FindAccountsQueryAllAccounts{})
	if err != nil {
		return EventsResult{}, fmt.Errorf("persistence: error looking up all accounts: %v", err)
	}

	results, err := p.dal.FindEvents(FindEventsQueryForSecretIDs{
		SecretIDs: hashUserIDForAccounts(query.UserID, accounts),
		Since:     query.Since,
	})
	if err != nil {
		return EventsResult{}, fmt.Errorf("persistence: error looking up events: %w", err)
	}
	out := EventsResult{}
	eventResults := EventsByAccountID{}
	seqs := []string{}
	for _, match := range results {
		eventResults[match.AccountID] = append(eventResults[match.AccountID], EventResult{
			AccountID: match.AccountID,
			Payload:   match.Payload,
			EventID:   match.EventID,
		})
		seqs = append(seqs, match.Sequence)
	}
	out.Events = &eventResults

	if query.Since != "" {
		pruned, err := p.dal.FindTombstones(FindTombstonesQueryBySecrets{
			SecretIDs: hashUserIDForAccounts(query.UserID, accounts),
			Since:     query.Since,
		})
		if err != nil {
			return EventsResult{}, fmt.Errorf("persistence: error finding deleted events: %w", err)
		}

		var prunedIDs []string
		for _, tombstone := range pruned {
			prunedIDs = append(prunedIDs, tombstone.EventID)
			seqs = append(seqs, tombstone.Sequence)
		}
		out.DeletedEvents = prunedIDs
	}

	out.Sequence = getLatestSeq(seqs)
	return out, nil
}

func (p *persistenceLayer) Purge(userID string) error {
	sequence, err := NewULID()
	if err != nil {
		return fmt.Errorf("persistence: error creating sequence number: %w", err)
	}

	txn, err := p.dal.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}

	accounts, err := txn.FindAccounts(FindAccountsQueryAllAccounts{})
	if err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error retrieving available accounts: %w", err)
	}

	hashedUserIDs := hashUserIDForAccounts(userID, accounts)

	affectedEvents, err := txn.FindEvents(FindEventsQueryForSecretIDs{SecretIDs: hashedUserIDs})
	if err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error looking up events to purge: %w", err)
	}
	for _, evt := range affectedEvents {
		if err := txn.CreateTombstone(&Tombstone{
			EventID:   evt.EventID,
			AccountID: evt.AccountID,
			SecretID:  evt.SecretID,
			Sequence:  sequence,
		}); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error creating tombstone for purged event: %w", err)
		}
	}

	if _, err := txn.DeleteEvents(DeleteEventsQueryBySecretIDs(hashedUserIDs)); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error purging events: %w", err)
	}

	if err := txn.Commit(); err != nil {
		return fmt.Errorf("persistence: error committing pruning of events: %w", err)
	}
	return nil
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
			hash, _ := account.HashUserID(userID)
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

func getLatestSeq(s []string) string {
	var latestSeq string
	for _, seq := range s {
		if strings.Compare(seq, latestSeq) == 1 {
			latestSeq = seq
		}
	}
	return latestSeq
}
