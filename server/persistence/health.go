// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

// CheckHealth returns an error when the database connection is not working.
func (p *persistenceLayer) CheckHealth() error {
	return p.dal.Ping()
}
