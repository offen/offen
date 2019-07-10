package local

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
)

func (*localKeyOps) GenerateRandomString(length int) (string, error) {
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		return "", fmt.Errorf("local: error creating random string: %v", err)
	}
	s := base64.URLEncoding.EncodeToString(b)
	return s[:length], nil
}
