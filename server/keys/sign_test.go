// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import "testing"

func TestSign_Verify(t *testing.T) {
	t.Run("not ok", func(t *testing.T) {
		val := "okidoki"
		secret := []byte("abc123")
		verifyErr := Verify(val, "oingo boingo", secret)
		if verifyErr == nil {
			t.Errorf("Expected error verifying bad signature, got: %v", verifyErr)
		}
	})

	t.Run("ok", func(t *testing.T) {
		val := "okidoki"
		secret := []byte("abc123")
		signature, signErr := Sign(val, secret)
		if signErr != nil {
			t.Errorf("Unexpected error signing value: %v", signErr)
		}

		verifyErr := Verify(val, signature, secret)
		if verifyErr != nil {
			t.Errorf("Unexpected error verifying signature: %v", verifyErr)
		}
	})
}
