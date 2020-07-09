// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"reflect"
	"testing"
)

func TestSymmetricEncryption(t *testing.T) {
	tests := []struct {
		name        string
		generateKey func() ([]byte, error)
	}{
		{
			"random",
			func() ([]byte, error) {
				return GenerateRandomBytes(DefaultEncryptionKeySize)
			},
		},
		{
			"derived",
			func() ([]byte, error) {
				return DeriveKey("mypassword", "{1,} XqiWf9CdPpmT3bu0aHkzjQ==")
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			key, err := test.generateKey()
			if err != nil {
				t.Fatalf("Unexpected error genrating key: %v", err)
			}
			value := []byte("much encryption, so wow")
			versionedCipher, err := EncryptWith(key, value)
			if err != nil {
				t.Fatalf("Unexpected error encrypting value")
			}
			plaintext, err := DecryptWith(key, versionedCipher.Marshal())
			if err != nil {
				t.Fatalf("Unexpected error decrypting value: %v", versionedCipher.Marshal())
			}
			if !reflect.DeepEqual(value, plaintext) {
				t.Errorf("Expected decrypted value to match original, got %s", string(plaintext))
			}
		})
	}
}
