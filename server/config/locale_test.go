// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"testing"
)

func TestLocale(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		var l Locale
		if err := l.Decode("en"); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if l.String() != "en" {
			t.Errorf("Unexpected value %v", l.String())
		}
	})
	t.Run("error", func(t *testing.T) {
		var l Locale
		if err := l.Decode("ru"); err == nil {
			t.Error("Unexpected nil error")
		}
	})
}
