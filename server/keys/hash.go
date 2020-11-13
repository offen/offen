// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"bytes"
	"crypto/sha256"
	"errors"
	"fmt"
	"os"
	"runtime"
	"strconv"

	"golang.org/x/crypto/argon2"
)

const (
	// It turned out that the initial argon2 configuration was _very_ memory
	// hungry, which is why new users are now receiving an updated config
	// that is slower, but consumes less memory.
	passwordAlgoArgon2HighMemoryConsumptionDEPRECATED = 1
	// This version turned out to be buggy as it was looking up the number of
	// CPUs at runtime for determining the number of threads, which meant
	// a database could not be migrated to a setup that would use a different
	// number of CPUs. See the function body for an explanation of the workaround.
	passwordAlgoArgon2NUMCPUBUG = 2
	passwordAlgoArgon2          = 3
)

// DeriveKey wraps package argon2 in order to derive a symmetric key from the
// given value (most likely a password) and the given salt.
func DeriveKey(value, versionedSalt string) ([]byte, error) {
	salt, saltErr := unmarshalVersionedCipher(versionedSalt)
	if saltErr != nil {
		return nil, fmt.Errorf("keys: error decoding salt into bytes: %w", saltErr)
	}
	switch salt.algoVersion {
	case passwordAlgoArgon2:
		key := defaultArgon2Hash([]byte(value), salt.cipher, DefaultEncryptionKeySize)
		return key, nil
	case passwordAlgoArgon2NUMCPUBUG:
		key := defaultArgon2HashNUMCPUBUG([]byte(value), salt.cipher, DefaultEncryptionKeySize)
		return key, nil
	case passwordAlgoArgon2HighMemoryConsumptionDEPRECATED:
		key := highMemoryArgon2HashDEPRECATED([]byte(value), salt.cipher, DefaultEncryptionKeySize)
		return key, nil
	default:
		return nil, fmt.Errorf("keys: received unknown algo version %d for deriving key", salt.algoVersion)
	}
}

// NewSalt creates a new salt value of the default length and wraps it in a
// versioned cipher using the latest available algo version
func NewSalt(len int) (*VersionedCipher, error) {
	b, err := GenerateRandomBytes(len)
	if err != nil {
		return nil, fmt.Errorf("keys: error generating random salt: %w", err)
	}
	return newVersionedCipher(b, passwordAlgoArgon2), nil
}

// HashString hashes the given string using argon2 using the latest configuration
func HashString(s string) (*VersionedCipher, error) {
	if s == "" {
		return nil, errors.New("keys: cannot hash an empty string")
	}
	salt, saltErr := GenerateRandomBytes(DefaultSecretLength)
	if saltErr != nil {
		return nil, fmt.Errorf("keys: error generating random salt for password hash: %w", saltErr)
	}
	hash := defaultArgon2Hash([]byte(s), salt, DefaultPasswordHashSize)
	return newVersionedCipher(hash, passwordAlgoArgon2).addNonce(salt), nil
}

// CompareString compares a string with a stored hash
func CompareString(s, versionedCipher string) error {
	if versionedCipher == "" {
		return errors.New("keys: cannot compare against an empty cipher")
	}
	cipher, err := unmarshalVersionedCipher(versionedCipher)
	if err != nil {
		return fmt.Errorf("keys: error parsing versioned cipher: %w", err)
	}
	switch cipher.algoVersion {
	case passwordAlgoArgon2:
		hashedInput := defaultArgon2Hash([]byte(s), cipher.nonce, DefaultPasswordHashSize)
		if bytes.Compare(hashedInput, cipher.cipher) != 0 {
			return errors.New("keys: could not match passwords")
		}
		return nil
	case passwordAlgoArgon2NUMCPUBUG:

		hashedInput := defaultArgon2HashNUMCPUBUG([]byte(s), cipher.nonce, DefaultPasswordHashSize)
		if bytes.Compare(hashedInput, cipher.cipher) != 0 {
			return errors.New("keys: could not match passwords")
		}
		return nil
	case passwordAlgoArgon2HighMemoryConsumptionDEPRECATED:
		hashedInput := highMemoryArgon2HashDEPRECATED([]byte(s), cipher.nonce, DefaultPasswordHashSize)
		if bytes.Compare(hashedInput, cipher.cipher) != 0 {
			return errors.New("keys: could not match passwords")
		}
		return nil
	default:
		return fmt.Errorf("keys: received unknown algo version %d for comparing passwords", cipher.algoVersion)
	}
}

func defaultArgon2Hash(val, salt []byte, size uint32) []byte {
	return argon2.IDKey(val, salt, 4, 16*1024, 4, size)
}

func defaultArgon2HashNUMCPUBUG(val, salt []byte, size uint32) []byte {
	// This version of the function contained a terrible bug:
	// By binding the number of threads to the number of available CPUs
	// it meant generated hashes would not be portable to machines with a
	// different number of CPUs available.
	// To work around this issue, an environment variable of OFFEN_NUMCPUOVERRIDE
	// can be set to the number of CPUs available at the time of setup.
	// All future hashes need to work against a fixed number of threads.
	numThreads := uint8(runtime.NumCPU())
	if override := os.Getenv("OFFEN_ARGONNUMCPUOVERRIDE"); override != "" {
		asInt, err := strconv.ParseInt(override, 10, 8)
		if err != nil {
			panic("OFFEN_ARGONNUMCPUOVERRIDE needs to be a numeric value.")
		}
		numThreads = uint8(asInt)
	}
	return argon2.IDKey(val, salt, 4, 16*1024, numThreads, size)
}

func highMemoryArgon2HashDEPRECATED(val, salt []byte, size uint32) []byte {
	return argon2.IDKey(val, salt, 1, 64*1024, 4, size)
}

const (
	hashAlgoSHA256 = 1
)

// HashFast creates a fast (i.e. not suitable for passwords) hash of the given
// value and the given salt
func HashFast(value, versionedSalt string) (string, error) {
	salt, err := unmarshalVersionedCipher(versionedSalt)
	if err != nil {
		return "", fmt.Errorf("keys: error unmarshaling given salt: %w", err)
	}
	switch salt.algoVersion {
	case hashAlgoSHA256:
		joined := append([]byte(value), salt.cipher...)
		hashed := sha256.Sum256(joined)
		return fmt.Sprintf("%x", hashed), nil
	default:
		return "", fmt.Errorf("keys: received unknown algo version %d for creating hash", salt.algoVersion)
	}
}

// NewFastSalt creates a new user salt value of the default length and wraps it in a
// versioned cipher
func NewFastSalt(len int) (*VersionedCipher, error) {
	b, err := GenerateRandomBytes(len)
	if err != nil {
		return nil, fmt.Errorf("keys: error generating user salt: %w", err)
	}
	return newVersionedCipher(b, hashAlgoSHA256), nil
}
