// Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"strings"
	"testing"

	"github.com/lestrrat-go/jwx/jwk"
)

func TestGenerateRSAKeyPair(t *testing.T) {
	t.Run("bad length", func(t *testing.T) {
		_, _, err := GenerateRSAKeypair(-17)
		if err == nil {
			t.Error("Expected error, got nil")
		}
	})
	t.Run("ok", func(t *testing.T) {
		public, private, err := GenerateRSAKeypair(4096)
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if _, err := jwk.Parse(private); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if _, err := jwk.Parse(public); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
	})
}

func TestEncryptAsymmetricWith(t *testing.T) {
	key, keyErr := rsa.GenerateKey(rand.Reader, 2048)
	if keyErr != nil {
		t.Fatalf("Unexpected error creating key: %v", keyErr)
	}

	public, ok := key.Public().(*rsa.PublicKey)
	if !ok {
		t.Fatal("Failed to cast key")
	}
	j, err := jwk.New(public)
	if err != nil {
		t.Fatalf("Unexpected error creating jwk: %v", err)
	}
	encrypted, err := EncryptAsymmetricWith(j, []byte("alice+bob"))
	if err != nil {
		t.Fatalf("Unexpected encrypting: %v", err)
	}
	b, err := base64.StdEncoding.DecodeString(strings.Split(encrypted.Marshal(), " ")[1])
	if err != nil {
		t.Fatalf("Unexpected error decoding: %v", err)
	}
	plaintext, err := key.Decrypt(rand.Reader, b, &rsa.OAEPOptions{
		Hash: crypto.SHA256,
	})
	if err != nil {
		t.Fatalf("Unexpected error decrypting cipher: %v", err)
	}
	if string(plaintext) != "alice+bob" {
		t.Errorf("Unexpected plaintext result %v", string(plaintext))
	}
}
