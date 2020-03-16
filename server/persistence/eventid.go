// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"math/rand"
	"time"

	"github.com/oklog/ulid"
)

// newEventID wraps the creation of a new ULID. These values are supposed to be
// used as the primary key for looking up events as it can be used as a
// `since` parameter without explicitly providing information about the actual
// timestamp like a `created_at` value would do.
func newEventID() (string, error) {
	return EventIDAt(time.Now())
}

// EventIDAt creates a new ULID based on the given timestamp
func EventIDAt(t time.Time) (string, error) {
	eventID, err := ulid.New(
		ulid.Timestamp(t),
		ulid.Monotonic(rand.New(rand.NewSource(t.UnixNano())), 0),
	)
	if err != nil {
		return "", err
	}
	return eventID.String(), nil
}
