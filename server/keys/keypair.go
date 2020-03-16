// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/lestrrat-go/jwx/jwk"
)

// GenerateRSAKeypair creates an RSA key pair of the requested length
func GenerateRSAKeypair(bits int) ([]byte, []byte, error) {
	key, keyErr := rsa.GenerateKey(rand.Reader, bits)
	if keyErr != nil {
		return nil, nil, keyErr
	}
	public, ok := key.Public().(*rsa.PublicKey)
	if !ok {
		return nil, nil, errors.New("keys: error reading public key from private key")
	}
	publicJWK, publicJWKErr := jwk.New(public)
	if publicJWKErr != nil {
		return nil, nil, fmt.Errorf("keys: error serializing public key: %v", publicJWKErr)
	}
	privateJWK, privateJWKErr := jwk.New(key)
	if privateJWKErr != nil {
		return nil, nil, fmt.Errorf("keys: error serializing privaze key: %v", privateJWKErr)
	}

	publicBytes, _ := json.Marshal(publicJWK)
	privateBytes, _ := json.Marshal(privateJWK)
	return publicBytes, privateBytes, nil
}
