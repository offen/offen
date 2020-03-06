// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

// Migrate runs the defined database migrations in the given db or initializes it
// from the latest definition if it is still blank.
func (p *persistenceLayer) Migrate() error {
	return p.dal.ApplyMigrations()
}
