package persistence

import (
	"fmt"
	"time"
)

// Expire deletes all events in the give database that are older than the given
// retention threshold.
func (r *relationalDatabase) Expire(retention time.Duration) (int, error) {
	limit := time.Now().Add(-retention)
	deadline, deadlineErr := EventIDAt(limit)
	if deadlineErr != nil {
		return 0, fmt.Errorf("persistence: error determing deadline for expiring events: %w", deadlineErr)
	}

	eventsAffected, err := r.deleteEvents(DeleteEventsQueryOlderThan(deadline))
	if err != nil {
		return 0, fmt.Errorf("persistence: error expiring events: %w", err)
	}

	return int(eventsAffected), nil
}
