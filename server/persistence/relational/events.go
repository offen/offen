// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package relational

import (
	"fmt"

	"github.com/offen/offen/server/persistence"
)

func (r *relationalDAL) CreateEvent(e *persistence.Event) error {
	local := importEvent(e)
	if err := r.db.Create(&local).Error; err != nil {
		return fmt.Errorf("relational: error creating event: %w", err)
	}
	return nil
}

func exportEvents(evts []Event) []persistence.Event {
	result := []persistence.Event{}
	for _, e := range evts {
		result = append(result, e.export())
	}
	return result
}

func (r *relationalDAL) FindEvents(q interface{}) ([]persistence.Event, error) {
	var events []Event
	switch query := q.(type) {
	case persistence.FindEventsQueryOlderThan:
		if err := r.db.Find(&events, "event_id < ?", query).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up events by age: %w", err)
		}
		return exportEvents(events), nil
	case persistence.FindEventsQueryForSecretIDs:
		var eventConditions []interface{}
		if query.Since != "" {
			eventConditions = []interface{}{
				"event_id > ? AND secret_id in (?)",
				query.Since,
				query.SecretIDs,
			}
		} else {
			eventConditions = []interface{}{
				"secret_id in (?)", query.SecretIDs,
			}
		}

		if err := r.db.Find(&events, eventConditions...).Error; err != nil {
			return nil, fmt.Errorf("default: error looking up events: %w", err)
		}
		return exportEvents(events), nil
	case persistence.FindEventsQueryByEventIDs:
		var limit int64 = 500
		var offset int64
		for {
			var nextEvents []Event
			var chunk []string
			if int64(len(query)) > offset+limit {
				chunk = query[offset : offset+limit]
			} else {
				chunk = query[offset:]
			}
			if err := r.db.Where("event_id IN (?)", chunk).Find(&nextEvents).Error; err != nil {
				return nil, fmt.Errorf("relational: error looking up events: %w", err)
			}
			events = append(events, nextEvents...)
			if int64(len(chunk)) < limit {
				break
			}
			offset += limit
		}
		return exportEvents(events), nil
	case persistence.FindEventsQueryExclusion:
		var offset int64
		var limit int64 = 500
		for {
			var nextEvents []Event
			var chunk []string
			if int64(len(query.EventIDs)) > offset+limit {
				chunk = query.EventIDs[offset : offset+limit]
			} else {
				chunk = query.EventIDs[offset:]
			}
			if err := r.db.Where(
				"event_id IN (?) AND secret_id NOT IN (?)",
				chunk,
				query.SecretIDs,
			).Find(&nextEvents).Error; err != nil {
				return nil, fmt.Errorf("relational: error looking up events: %w", err)
			}
			events = append(events, nextEvents...)
			if int64(len(chunk)) < limit {
				break
			}
			offset += limit
		}
		return exportEvents(events), nil
	default:
		return nil, persistence.ErrBadQuery
	}
}

func (r *relationalDAL) DeleteEvents(q interface{}) (int64, error) {
	switch query := q.(type) {
	case persistence.DeleteEventsQueryByEventIDs:
		deletion := r.db.Where("event_id in (?)", []string(query)).Delete(&Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("relational: error deleting orphaned events: %w", err)
		}
		return deletion.RowsAffected, nil
	case persistence.DeleteEventsQueryBySecretIDs:
		deletion := r.db.Where(
			"secret_id IN (?)",
			[]string(query),
		).Delete(&Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("relational: error deleting events: %w", err)
		}
		return deletion.RowsAffected, nil
	case persistence.DeleteEventsQueryOlderThan:
		deletion := r.db.Where("event_id < ?", string(query)).Delete(&Event{})
		if err := deletion.Error; err != nil {
			return 0, fmt.Errorf("relational: error deleting events: %w", err)
		}
		return deletion.RowsAffected, nil
	default:
		return 0, persistence.ErrBadQuery
	}
}

func (r *relationalDAL) CreateTombstone(t *persistence.Tombstone) error {
	local := importTombstone(t)
	if err := r.db.Create(&local).Error; err != nil {
		return fmt.Errorf("relational: error creating tombstone: %w", err)
	}
	return nil
}

func (r *relationalDAL) FindTombstones(q interface{}) ([]persistence.Tombstone, error) {
	switch query := q.(type) {
	case persistence.FindTombstonesQuerySince:
		var result []Tombstone
		if err := r.db.Find(&result, "account_id = ? AND sequence > ?", query.AccountID, query.Since).Error; err != nil {
			return nil, fmt.Errorf("relational: error looking up tombstones: %w", err)
		}
		var export []persistence.Tombstone
		for _, t := range result {
			export = append(export, t.export())
		}
		return export, nil
	default:
		return nil, persistence.ErrBadQuery
	}
}
