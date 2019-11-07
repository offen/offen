package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateEvent(e *persistence.Event) error {
	if err := r.db.Create(e).Error; err != nil {
		return fmt.Errorf("persistence: error creating event: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindEvents(q interface{}) ([]persistence.Event, error) {
	var events []persistence.Event
	switch query := q.(type) {
	case persistence.FindEventsQueryForHashedIDs:
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
	case persistence.FindEventsQueryByEventIDs:
		if err := r.db.Where("event_id IN (?)", []string(query)).Find(&events).Error; err != nil {
			return nil, fmt.Errorf("persistence: error looking up events: %w", err)
		}
		return events, nil
	case persistence.FindEventsQueryExclusion:
		if err := r.db.Where(
			"event_id IN (?) AND hashed_user_id NOT IN (?)",
			query.EventIDs,
			query.HashedUserIDs,
		).Find(&events).Error; err != nil {
			return nil, fmt.Errorf("persistence: error looking up events: %w", err)
		}
		return events, nil
	default:
		return events, persistence.ErrBadQuery
	}
}

func (r *relationalDAL) DeleteEvents(q interface{}) (int64, error) {
	switch query := q.(type) {
	case persistence.DeleteEventsQueryByEventIDs:
		deletion := r.db.Where("event_id in (?)", []string(query)).Delete(persistence.Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("persistence: error deleting orphaned events: %w", err)
		}
		return deletion.RowsAffected, nil
	case persistence.DeleteEventsQueryByHashedIDs:
		deletion := r.db.Where(
			"hashed_user_id IN (?)",
			[]string(query),
		).Delete(persistence.Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("persistence: error deleting events: %w", err)
		}
		return deletion.RowsAffected, nil
	case persistence.DeleteEventsQueryOlderThan:
		deletion := r.db.Where("event_id < ?", string(query)).Delete(&persistence.Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("persistence: error deleting events: %w", err)
		}
		return deletion.RowsAffected, nil
	default:
		return 0, persistence.ErrBadQuery
	}
}
