// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"bytes"
	"testing"
)

func TestBytes(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		var b Bytes
		if err := b.Decode("b2s="); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if !bytes.Equal(b.Bytes(), []byte("ok")) {
			t.Errorf("Unexpected value %v", b.Bytes())
		}
		if b.IsZero() {
			t.Error("Expected populated value not to be zero")
		}
	})
	t.Run("error", func(t *testing.T) {
		var b Bytes
		if err := b.Decode("not base64 in any way"); err == nil {
			t.Error("Unexpected nil error")
		}
		if !b.IsZero() {
			t.Error("Expected error value to be zero")
		}
	})
}
