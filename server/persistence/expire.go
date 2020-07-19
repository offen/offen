// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"fmt"
	"time"
)

// Expire deletes all events in the give database that are older than the given
// retention threshold.
func (p *persistenceLayer) Expire(retention time.Duration) (int, error) {
	limit := time.Now().Add(-retention)
	deadline, deadlineErr := EventIDAt(limit)
	if deadlineErr != nil {
		return 0, fmt.Errorf("persistence: error determing deadline for expiring events: %w", deadlineErr)
	}

	sequence, seqErr := NewULID()
	if seqErr != nil {
		return 0, fmt.Errorf("persistence: error creating sequence number: %w", seqErr)
	}

	txn, err := p.dal.Transaction()
	if err != nil {
		return 0, fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	expiredEvents, err := txn.FindEvents(FindEventsQueryOlderThan(deadline))
	if err != nil {
		txn.Rollback()
		return 0, fmt.Errorf("persistence: error looking up expired events: %w", err)
	}

	for _, evt := range expiredEvents {
		if err := txn.CreateTombstone(&Tombstone{
			AccountID: evt.AccountID,
			EventID:   evt.EventID,
			Sequence:  sequence,
		}); err != nil {
			txn.Rollback()
			return 0, fmt.Errorf("persistence: error creating tombstone: %w", err)
		}
	}

	eventsAffected, err := txn.DeleteEvents(DeleteEventsQueryOlderThan(deadline))
	if err != nil {
		txn.Rollback()
		return 0, fmt.Errorf("persistence: error deleting expired events: %w", err)
	}

	if err := txn.Commit(); err != nil {
		return 0, fmt.Errorf("persistence: error expiring events: %w", err)
	}
	return int(eventsAffected), nil
}
