package keys

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"fmt"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/scrypt"
)

// GenerateEncryptionKey generates a slice of bytes of the given size that is
// supposed to be used as a symmetric key.
func GenerateEncryptionKey(size int) ([]byte, error) {
	key, err := randomBytes(size)
	if err != nil {
		return nil, fmt.Errorf("keys: error generating encryption key: %v", err)
	}
	return key, nil
}

const (
	aesGCMAlgo = 1
)

// EncryptWith encrypts the given value symmetrically using the given key.
// In case of success it also returns the unique nonce value that has been used
// for encrypting the value and will be needed for clients that want to decrypt
// the ciphertext.
func EncryptWith(key, value []byte) (*VersionedCipher, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("keys: error generating block from key: %v", err)
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("keys: error creating GCM from block: %v", err)
	}

	// Never use more than 2^32 random nonces with a given key because of the
	// risk of a repeat.
	nonce, nonceErr := randomBytes(aesgcm.NonceSize())
	if nonceErr != nil {
		return nil, fmt.Errorf("keys: error generating nonce for encryption: %v", nonceErr)
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

// DeriveKey wraps package scrypt in order to derive a symmetric key from the
// given value (most likely a password) and the given salt.
func DeriveKey(value, salt string) ([]byte, error) {
	saltBytes, saltErr := base64.StdEncoding.DecodeString(salt)
	if saltErr != nil {
		return nil, fmt.Errorf("keys: error decoding salt into bytes: %w", saltErr)
	}

	dk, err := scrypt.Key([]byte(value), saltBytes, 1<<15, 8, 1, DefaultEncryptionKeySize)
	if err != nil {
		return nil, fmt.Errorf("keys: error creating derived key: %v", err)
	}
	return dk, nil
}

const (
	passwordAlgoBcrypt = 1
)

// HashPassword hashed the given password using bcrypt at default cost
func HashPassword(pw string) (*VersionedCipher, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("keys: error hashing password: %v", err)
	}
	return newVersionedCipher(b, passwordAlgoBcrypt), nil
}

// ComparePassword compares a password with a stored hash
func ComparePassword(password, cipher string) error {
	v, err := unmarshalVersionedCipher(cipher)
	if err != nil {
		return fmt.Errorf("keys: error parsing versioned cipher: %w", err)
	}
	switch v.algoVersion {
	case passwordAlgoBcrypt:
		return bcrypt.CompareHashAndPassword(v.cipher, []byte(password))
	default:
		return fmt.Errorf("keys: received unknown algo version %d for comparing passwords", v.algoVersion)
	}
}

// HashEmail hashed the given string value using the given salt. It is not
// intended to be used with passwords as it is supposed to be a cheap operation.
func HashEmail(email string, salt []byte) (string, error) {
	result := sha256.Sum256(append([]byte(email), salt...))
	return base64.StdEncoding.EncodeToString(result[:]), nil
}
