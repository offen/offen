// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"fmt"
	"io"
	"math/rand"
	"time"

	"github.com/oklog/ulid"
)

// NewULID wraps the creation of a new ULID. These values are supposed to be
// used as the primary key for looking up events as it can be used as a
// `since` parameter without explicitly providing information about the actual
// timestamp like a `created_at` value would do.
func NewULID() (string, error) {
	return EventIDAt(time.Now())
}

var entropy io.Reader

// EventIDAt creates a new ULID based on the given timestamp
func EventIDAt(t time.Time) (string, error) {
	if entropy == nil {
		entropy = ulid.Monotonic(rand.New(rand.NewSource(t.UnixNano())), 0)
	}
	eventID, err := ulid.New(
		ulid.Timestamp(t),
		entropy,
	)
	if err != nil {
		return "", fmt.Errorf("persistence: error creating new ULID: %w", err)
	}
	return eventID.String(), nil
}

func siblingEventID(id string) (string, error) {
	pid, err := ulid.Parse(id)
	if err != nil {
		return "", fmt.Errorf("persistence: error parsing given string to ULID: %w", err)
	}

	return EventIDAt(ulid.Time(pid.Time()))
}
