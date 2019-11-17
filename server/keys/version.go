package keys

import (
	"encoding/base64"
	"errors"
	"fmt"
	"regexp"
	"strconv"
)

var parseCipherRE = regexp.MustCompile(`^{(\d+?),(\d*?)}\s(.+)`)

type VersionedCipher struct {
	cipher      []byte
	algoVersion int
	keyVersion  int
}

func NewVersionedCipher(cipher []byte, algoVersion, keyVersion int) *VersionedCipher {
	return &VersionedCipher{
		cipher:      cipher,
		algoVersion: algoVersion,
		keyVersion:  keyVersion,
	}
}

func (v *VersionedCipher) Marshal() string {
	keyRepr := ""
	if v.keyVersion >= 0 {
		keyRepr = fmt.Sprintf("%d", v.keyVersion)
	}
	return fmt.Sprintf(
		"{%d,%s} %s",
		v.algoVersion,
		keyRepr,
		base64.StdEncoding.EncodeToString(v.cipher),
	)
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

	b, decodeErr := base64.StdEncoding.DecodeString(parseResult[3])
	if decodeErr != nil {
		return nil, fmt.Errorf("keys: error decoding ciphertext: %w", decodeErr)
	}
	return &VersionedCipher{
		cipher: b, algoVersion: algoVersion, keyVersion: keyVersion,
	}, nil
}
