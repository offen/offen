// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"fmt"
)

// GenerateRandomBytes generates a slice of bytes of the given size that is
// supposed to be used as a symmetric key.
func GenerateRandomBytes(size int) ([]byte, error) {
	b := make([]byte, size)
	_, err := rand.Read(b)
	if err != nil {
		return nil, fmt.Errorf("keys: error reading random bytes: %w", err)
	}
	return b, nil
}

const (
	aesGCMAlgo  = 1
	rsaOAEPAlgo = 1
)

// EncryptWith encrypts the given value symmetrically using the given key.
// In case of success it also returns the unique nonce value that has been used
// for encrypting the value and will be needed for clients that want to decrypt
// the ciphertext.
func EncryptWith(key, value []byte) (*VersionedCipher, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("keys: error generating block from key: %w", err)
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("keys: error creating GCM from block: %w", err)
	}

	// Never use more than 2^32 random nonces with a given key because of the
	// risk of a repeat.
	nonce, nonceErr := GenerateRandomBytes(aesgcm.NonceSize())
	if nonceErr != nil {
		return nil, fmt.Errorf("keys: error generating nonce for encryption: %w", nonceErr)
	}
	ciphertext := aesgcm.Seal(nil, nonce, value, nil)
	return newVersionedCipher(ciphertext, aesGCMAlgo).addNonce(nonce), nil
}

// DecryptWith decrypts the given value using the given key and nonce value.
func DecryptWith(key []byte, s string) ([]byte, error) {
	block, blockErr := aes.NewCipher(key)
	if blockErr != nil {
		return nil, fmt.Errorf("keys: error creating block from key: %w", blockErr)
	}
	aesgcm, gcmErr := cipher.NewGCM(block)
	if gcmErr != nil {
		return nil, fmt.Errorf("keys: error creating GCM from block: %w", gcmErr)
	}
	v, err := unmarshalVersionedCipher(s)
	if err != nil {
		return nil, fmt.Errorf("keys: error unmarshaling cipher: %w", err)
	}
	return aesgcm.Open(nil, v.nonce, v.cipher, nil)
}
