// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"errors"
	"fmt"

	"golang.org/x/crypto/argon2"
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
	default:
		return nil, fmt.Errorf("keys: received unknown algo version %d for deriving key", salt.algoVersion)
	}
}

const (
	passwordAlgoArgon2 = 1
)

// NewSalt creates a new salt value of the default length and wraps it in a
// versioned cipher
func NewSalt() (*VersionedCipher, error) {
	b, err := GenerateRandomBytes(DefaultSaltLength)
	if err != nil {
		return nil, fmt.Errorf("keys: error generating random salt: %w", err)
	}
	return newVersionedCipher(b, passwordAlgoArgon2), nil
}

// HashString hashed the given string using argon2
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
	default:
		return fmt.Errorf("keys: received unknown algo version %d for comparing passwords", v.algoVersion)
	}
}

func defaultArgon2Hash(val, salt []byte, size uint32) []byte {
	return argon2.IDKey(val, salt, 1, 64*1024, 4, size)
}
