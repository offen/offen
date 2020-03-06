// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

var parseCipherRE = regexp.MustCompile(`^{(\d+?),(\d*?)}\s(.+)`)

// VersionedCipher adds meta information to a ciphertext string.
type VersionedCipher struct {
	cipher      []byte
	nonce       []byte
	algoVersion int
	keyVersion  int
}

func newVersionedCipher(cipher []byte, algoVersion int) *VersionedCipher {
	return &VersionedCipher{
		cipher:      cipher,
		algoVersion: algoVersion,
		keyVersion:  -1,
	}
}

func (v *VersionedCipher) addNonce(n []byte) *VersionedCipher {
	v.nonce = n
	return v
}

func (v *VersionedCipher) addKeyVersion(k int) *VersionedCipher {
	v.keyVersion = k
	return v
}

// Marshal returns the string representation of v. It can be deserialized again
// using unmarshalVersionedCipher.
func (v *VersionedCipher) Marshal() string {
	keyRepr := ""
	if v.keyVersion >= 0 {
		keyRepr = fmt.Sprintf("%d", v.keyVersion)
	}
	base := fmt.Sprintf(
		"{%d,%s} %s",
		v.algoVersion,
		keyRepr,
		base64.StdEncoding.EncodeToString(v.cipher),
	)
	if v.nonce != nil {
		base = fmt.Sprintf("%s %s", base, base64.StdEncoding.EncodeToString(v.nonce))
	}
	return base
}

func unmarshalVersionedCipher(s string) (*VersionedCipher, error) {
	parseResult := parseCipherRE.FindStringSubmatch(s)
	if parseResult == nil || len(parseResult) != 4 {
		return nil, errors.New("keys: could not parse given versioned cipher")
	}

	algoVersion, algoErr := strconv.Atoi(parseResult[1])
	if algoErr != nil {
		return nil, fmt.Errorf("keys: error parsing algorithm version to number: %w", algoErr)
	}

	keyVersion := -1
	if parseResult[2] != "" {
		var keyErr error
		keyVersion, keyErr = strconv.Atoi(parseResult[2])
		if keyErr != nil {
			return nil, fmt.Errorf("keys: error parsing key version to number: %w", algoErr)
		}
	}

	chunks := strings.Split(parseResult[3], " ")

	b, decodeErr := base64.StdEncoding.DecodeString(chunks[0])
	if decodeErr != nil {
		return nil, fmt.Errorf("keys: error decoding ciphertext: %w", decodeErr)
	}

	v := &VersionedCipher{
		cipher: b, algoVersion: algoVersion, keyVersion: keyVersion,
	}

	if len(chunks) > 1 {
		n, decodeErr := base64.StdEncoding.DecodeString(chunks[1])
		if decodeErr != nil {
			return nil, fmt.Errorf("keys: error decoding ciphertext: %w", decodeErr)
		}
		v.addNonce(n)
	}

	return v, nil
}
