package keys

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"io"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/scrypt"
)

const DefaultEncryptionKeySize = 32

func GenerateEncryptionKey(size int) ([]byte, error) {
	key := make([]byte, size)
	_, err := rand.Read(key)
	if err != nil {
		return nil, err
	}
	return key, nil
}

func EncryptWith(key, value []byte) ([]byte, []byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, nil, err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, err
	}

	// Never use more than 2^32 random nonces with a given key because of the risk of a repeat.
	nonce := make([]byte, aesgcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, nil, err
	}
	ciphertext := aesgcm.Seal(nil, nonce, value, nil)
	return ciphertext, nonce, nil
}

func DecryptWith(key, value, nonce []byte) ([]byte, error) {
	block, blockErr := aes.NewCipher(key)
	if blockErr != nil {
		return nil, fmt.Errorf("error creating cipher: %v", blockErr)
	}
	aesgcm, gcmErr := cipher.NewGCM(block)
	if gcmErr != nil {
		return nil, fmt.Errorf("error creating gcm: %v", gcmErr)
	}
	return aesgcm.Open(nil, nonce, value, nil)
}

func DeriveKey(value string, salt []byte) ([]byte, error) {
	dk, err := scrypt.Key([]byte(value), salt, 1<<15, 8, 1, 32)
	if err != nil {
		return nil, err
	}
	return dk, nil
}

func HashPassword(pw string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(pw), 16)
}

func ComparePassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func HashEmail(email string, salt string) ([]byte, error) {
	result := sha256.Sum256([]byte(fmt.Sprintf("%s-%s", email, salt)))
	return result[:], nil
}
