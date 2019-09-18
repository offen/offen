package keys

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"time"
)

// Authentication contains a set of values that can be used for granting
// access to certain resources to third parties. All characters in the contained
// strings are expected to be URL-safe.
type Authentication struct {
	Expires   int64  `json:"expires"`
	Token     string `json:"token"`
	Signature string `json:"signature"`
}

func joinArgs(scope string, token []byte, expires int64) []byte {
	out := []byte{}
	out = append(out, []byte(scope)...)
	out = append(out, token...)
	out = append(out, []byte(fmt.Sprintf("%d", expires))...)
	return out
}

// Validate checks if the authentication is valid against the given secret and
// if it hasn't expired yet.
func (a *Authentication) Validate(scope string, secret []byte) error {
	mac := hmac.New(sha256.New, secret)
	tokenBytes, tokenErr := base64.URLEncoding.DecodeString(a.Token)
	if tokenErr != nil {
		return fmt.Errorf("authentication: error decoding token: %v", tokenErr)
	}
	_, writeErr := mac.Write(joinArgs(scope, tokenBytes, a.Expires))
	if writeErr != nil {
		return fmt.Errorf("authentication: error decoding signature: %v", writeErr)
	}
	expectedMAC := mac.Sum(nil)
	sig, sigErr := base64.URLEncoding.DecodeString(a.Signature)
	if sigErr != nil {
		return fmt.Errorf("authentication: error decoding signature: %v", sigErr)
	}
	if !hmac.Equal(expectedMAC, sig) {
		return errors.New("authentication: signature did not match")
	}
	if time.Unix(a.Expires, 0).Before(time.Now()) {
		return errors.New("authentication: credentials have already expired")
	}
	return nil
}

// NewAuthentication generates a new set of credentials using the given secret.
// The credentials are considered valid until the given deadline has passed.
func NewAuthentication(scope string, secret []byte, deadline time.Duration) (*Authentication, error) {
	if len(secret) == 0 {
		return nil, errors.New("authentication: received empty secret, cannot continue")
	}

	token, tokenErr := GenerateRandomValueWith(16, base64.URLEncoding)
	if tokenErr != nil {
		return nil, fmt.Errorf("authentication: error creating token: %v", tokenErr)
	}
	tokenBytes, tokenBytesErr := base64.URLEncoding.DecodeString(token)
	if tokenBytesErr != nil {
		return nil, fmt.Errorf("authentication: error decoding token: %v", tokenBytesErr)
	}

	expires := time.Now().Add(deadline).Unix()

	mac := hmac.New(sha256.New, secret)
	_, writeErr := mac.Write(joinArgs(scope, tokenBytes, expires))
	if writeErr != nil {
		return nil, fmt.Errorf("authentication: error writing signature: %v", writeErr)
	}
	signature := mac.Sum(nil)

	return &Authentication{
		Expires:   expires,
		Token:     token,
		Signature: base64.URLEncoding.EncodeToString(signature),
	}, nil
}
