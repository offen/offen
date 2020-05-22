// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"testing"

	"github.com/sirupsen/logrus"
)

func TestLogLevel(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		var l LogLevel
		if err := l.Decode("warn"); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if l.LogLevel() != logrus.WarnLevel {
			t.Errorf("Unexpected log level %v", l.LogLevel())
		}
	})
	t.Run("error", func(t *testing.T) {
		var l LogLevel
		if err := l.Decode("zalgo"); err == nil {
			t.Error("Unexpected nil error")
		}
	})
}
