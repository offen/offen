// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

// +build !windows

package config

import (
	"os"
	"testing"
)

func TestEnvString(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		defer os.Setenv("VALUE", os.Getenv("VALUE"))
		os.Setenv("VALUE", "value")

		var s EnvString
		if err := s.Decode("my-$VALUE"); err != nil {
			t.Errorf("Unexpected error %v", err)
		}

		if s.RawString() != "my-$VALUE" {
			t.Errorf("Unexpected value %v", s.RawString())
		}

		if s.String() != "my-value" {
			t.Errorf("Unexpected value %v", s.String())
		}
	})
}
