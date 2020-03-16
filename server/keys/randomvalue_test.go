// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package keys

import (
	"encoding/base64"
	"encoding/hex"
	"testing"
)

func TestGenerateRandomValue(t *testing.T) {
	results := []string{}
	for i := 0; i < 16; i++ {
		s, err := GenerateRandomValue(32)
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		val, err := base64.StdEncoding.DecodeString(s)
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if len(val) != 32 {
			t.Errorf("Unexpected result length %d", len(val))
		}
		for _, previous := range results {
			if previous == s {
				t.Errorf("Unexpected duplicate %v", s)
			}
		}
		results = append(results, s)
	}
}

type hexEncoder struct{}

func (*hexEncoder) EncodeToString(b []byte) string {
	return hex.EncodeToString(b)
}
func TestGenerateRandomValueWith(t *testing.T) {
	value, err := GenerateRandomValueWith(12, &hexEncoder{})
	if err != nil {
		t.Errorf("Unexpected error %v", err)
	}
	b, err := hex.DecodeString(value)
	if err != nil {
		t.Errorf("Unexpected error %v", err)
	}
	if len(b) != 12 {
		t.Errorf("Unexpected result length %d", len(b))
	}
}
