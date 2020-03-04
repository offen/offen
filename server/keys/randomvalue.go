package keys

import (
	"encoding/base64"
)

// StringEncoder can encode a byte slice into a printable string.
type StringEncoder interface {
	EncodeToString([]byte) string
}

func randomBytesWithEncoding(length int, e StringEncoder) (string, error) {
	b, err := GenerateRandomBytes(length)
	if err != nil {
		return "", err
	}
	return e.EncodeToString(b), nil
}

// GenerateRandomValue returns a slice of random values encoded as a
// Base64 string. This means the returned string will likely be longer than
// the requested length.
func GenerateRandomValue(length int) (string, error) {
	return randomBytesWithEncoding(length, base64.StdEncoding)
}

// GenerateRandomValueWith returns a slice of random values encoded as a
// URL-sage Base64 string.
func GenerateRandomValueWith(length int, encoder StringEncoder) (string, error) {
	return randomBytesWithEncoding(length, encoder)
}
