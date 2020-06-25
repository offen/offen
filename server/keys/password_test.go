// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import "testing"

func TestValidatePassword(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		if err := ValidatePassword("development"); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
	})
	t.Run("not ok", func(t *testing.T) {
		if err := ValidatePassword("dev"); err == nil {
			t.Error("Expected error when giving short password, received nil")
		}
	})
}
