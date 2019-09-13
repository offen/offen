package keys

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

// GenerateRandomValue returns a slice of random values encoded as a
// Base64 string. This means the returned string will likely be longer than
// the requested length.
func GenerateRandomValue(length int) (string, error) {
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		return "", fmt.Errorf("keys: error creating random value: %v", err)
	}
	return base64.StdEncoding.EncodeToString(b), nil
}

// GenerateRandomURLValue returns a slice of random values encoded as a
// Base64 string. This means the returned string will likely be longer than
// the requested length.
func GenerateRandomURLValue(length int) (string, error) {
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		return "", fmt.Errorf("keys: error creating random value: %v", err)
	}
	return base64.URLEncoding.EncodeToString(b), nil
}
