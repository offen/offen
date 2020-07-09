// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"bytes"
	"errors"
	"fmt"
	"runtime"

	"golang.org/x/crypto/argon2"
)

const (
	// It turned out that the initial argon2 configuration was _very_ memory
	// hungry, which is why new users are now receiving an updated config
	// that is slower, but consumes less memory.
	passwordAlgoArgon2HighMemoryConsumption = 1
	passwordAlgoArgon2                      = 2
)

// DeriveKey wraps package argon2 in order to derive a symmetric key from the
// given value (most likely a password) and the given salt.
func DeriveKey(value, encodedSalt string) ([]byte, error) {
	salt, saltErr := unmarshalVersionedCipher(encodedSalt)
	if saltErr != nil {
		return nil, fmt.Errorf("keys: error decoding salt into bytes: %w", saltErr)
	}
	switch salt.algoVersion {
	case passwordAlgoArgon2:
		key := defaultArgon2Hash([]byte(value), salt.cipher, DefaultEncryptionKeySize)
		return key, nil
	case passwordAlgoArgon2HighMemoryConsumption:
		key := highMemoryArgon2Hash([]byte(value), salt.cipher, DefaultEncryptionKeySize)
		return key, nil
	default:
		return nil, fmt.Errorf("keys: received unknown algo version %d for deriving key", salt.algoVersion)
	}
}

// NewSalt creates a new salt value of the default length and wraps it in a
// versioned cipher
func NewSalt() (*VersionedCipher, error) {
	b, err := GenerateRandomBytes(DefaultSaltLength)
	if err != nil {
		return nil, fmt.Errorf("keys: error generating random salt: %w", err)
	}
	return newVersionedCipher(b, passwordAlgoArgon2), nil
}

// HashString hashes the given string using argon2
func HashString(pw string) (*VersionedCipher, error) {
	if pw == "" {
		return nil, errors.New("keys: cannot hash an empty string")
	}
	salt, saltErr := GenerateRandomBytes(DefaultSecretLength)
	if saltErr != nil {
		return nil, fmt.Errorf("keys: error generating random salt for password hash: %w", saltErr)
	}
	hash := defaultArgon2Hash([]byte(pw), salt, DefaultPasswordHashSize)
	return newVersionedCipher(hash, passwordAlgoArgon2).addNonce(salt), nil
}

// CompareString compares a string with a stored hash
func CompareString(password, cipher string) error {
	if cipher == "" {
		return errors.New("keys: cannot compare against an empty cipher")
	}
	v, err := unmarshalVersionedCipher(cipher)
	if err != nil {
		return fmt.Errorf("keys: error parsing versioned cipher: %w", err)
	}
	switch v.algoVersion {
	case passwordAlgoArgon2:
		hash := defaultArgon2Hash([]byte(password), v.nonce, DefaultPasswordHashSize)
		if bytes.Compare(hash, v.cipher) != 0 {
			return errors.New("keys: could not match passwords")
		}
		return nil
	case passwordAlgoArgon2HighMemoryConsumption:
		hash := highMemoryArgon2Hash([]byte(password), v.nonce, DefaultPasswordHashSize)
		if bytes.Compare(hash, v.cipher) != 0 {
			return errors.New("keys: could not match passwords")
		}
		return nil
	default:
		return fmt.Errorf("keys: received unknown algo version %d for comparing passwords", v.algoVersion)
	}
}

func defaultArgon2Hash(val, salt []byte, size uint32) []byte {
	return argon2.IDKey(val, salt, 4, 16*1024, uint8(runtime.NumCPU()), size)
}

func highMemoryArgon2Hash(val, salt []byte, size uint32) []byte {
	return argon2.IDKey(val, salt, 1, 64*1024, 4, size)
}
