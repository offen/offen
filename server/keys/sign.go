package keys

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
)

func sign(value string, secret []byte) ([]byte, error) {
	h := hmac.New(sha256.New, secret)
	if _, err := h.Write([]byte(value)); err != nil {
		return nil, fmt.Errorf("keys: error signing value: %w", err)
	}
	return h.Sum(nil), nil
}

func Sign(value string, secret []byte) (string, error) {
	bytes, err := sign(value, secret)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(bytes), nil
}

func Verify(value, mac string, secret []byte) error {
	compare, err := sign(value, secret)
	if err != nil {
		return fmt.Errorf("keys: error computing mac for comparison: %w", err)
	}
	macBytes, err := base64.StdEncoding.DecodeString(mac)
	if err != nil {
		return fmt.Errorf("keys: error decoding given mac: %w", err)
	}
	if !hmac.Equal(macBytes, compare) {
		return errors.New("keys: signature did not match value")
	}
	return nil
}
