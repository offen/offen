// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package config

import "testing"

func TestDialect(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		var d Dialect
		if err := d.Decode("sqlite3"); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if d.String() != "sqlite3" {
			t.Errorf("Unexpected value %v", d.String())
		}
	})
	t.Run("error", func(t *testing.T) {
		var d Dialect
		if err := d.Decode("zombodb"); err == nil {
			t.Error("Unexpected nil error")
		}
	})
}
