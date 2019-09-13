package keys

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

type stringEncoder interface {
	EncodeToString([]byte) string
}

func randomBytes(length int, e stringEncoder) (string, error) {
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		return "", fmt.Errorf("keys: error reading random bytes: %v", err)
	}
	return e.EncodeToString(b), nil
}

// GenerateRandomValue returns a slice of random values encoded as a
// Base64 string. This means the returned string will likely be longer than
// the requested length.
func GenerateRandomValue(length int) (string, error) {
	return randomBytes(length, base64.StdEncoding)
}

// GenerateRandomURLValue returns a slice of random values encoded as a
// URL-sage Base64 string.
func GenerateRandomURLValue(length int) (string, error) {
	return randomBytes(length, base64.URLEncoding)
}
