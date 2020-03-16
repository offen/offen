// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import "testing"

func TestErrUnknownAccount(t *testing.T) {
	err := ErrUnknownAccount("unknown")
	if message := err.Error(); message != "unknown" {
		t.Errorf("Unexpected error message %s", message)
	}
}

func TestErrUnknownSecret(t *testing.T) {
	err := ErrUnknownSecret("unknown")
	if message := err.Error(); message != "unknown" {
		t.Errorf("Unexpected error message %s", message)
	}
}
