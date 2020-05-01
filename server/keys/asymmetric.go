// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
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

// EncryptAsymmetricWith uses the given RSA Public Key in JWK format to encrypt the
// given value into a versioned cipher.
func EncryptAsymmetricWith(publicKey interface{}, value []byte) (*VersionedCipher, error) {
	key, keyOk := publicKey.(jwk.Key)
	if !keyOk {
		return nil, errors.New("keys: could not convert given argument to jwk")
	}
	m, mErr := key.Materialize()
	if mErr != nil {
		return nil, fmt.Errorf("keys: error materializing JWK key: %w", mErr)
	}
	pubKey, pubKeyOk := m.(*rsa.PublicKey)
	if !pubKeyOk {
		return nil, errors.New("keys: error casting materialized key to correct type")
	}
	encrypted, encryptedErr := rsa.EncryptOAEP(sha256.New(), rand.Reader, pubKey, value, nil)
	if encryptedErr != nil {
		return nil, fmt.Errorf("keys: error encrypting given value: %w", encryptedErr)
	}
	return newVersionedCipher(encrypted, 1), nil
}
