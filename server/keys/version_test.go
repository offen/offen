package keys

import (
	"reflect"
	"testing"
)

func intptr(i int) *int { return &i }

func TestNewVersionedCipher(t *testing.T) {
	tests := []struct {
		name           string
		cipher         []byte
		nonce          []byte
		algoVersion    int
		keyVersion     *int
		expectedResult string
	}{
		{
			"no key version",
			[]byte("abc"),
			nil,
			1,
			nil,
			"{1,} YWJj",
		},
		{
			"with key version",
			[]byte("abc"),
			nil,
			2,
			intptr(3),
			"{2,3} YWJj",
		},
		{
			"with nonce",
			[]byte("abc"),
			[]byte("xyz"),
			2,
			nil,
			"{2,} YWJj eHl6",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			v := newVersionedCipher(test.cipher, test.algoVersion)
			if test.keyVersion != nil {
				v.addKeyVersion(*test.keyVersion)
			}
			if test.nonce != nil {
				v.addNonce(test.nonce)
			}
			result := v.Marshal()
			if test.expectedResult != result {
				t.Errorf("Expected %v, got %v", test.expectedResult, result)
			}
		})
	}
}

func TestParseVersionedCipher(t *testing.T) {
	tests := []struct {
		name           string
		input          string
		expectedResult *VersionedCipher
		expectError    bool
	}{
		{
			"bad pattern",
			"xuuusxa",
			nil,
			true,
		},
		{
			"missing braces",
			"{1, YWJj",
			nil,
			true,
		},
		{
			"no key version",
			"{1,} YWJj",
			&VersionedCipher{
				[]byte("abc"),
				nil,
				1,
				-1,
			},
			false,
		},
		{
			"full info",
			"{4,1} YWJj",
			&VersionedCipher{
				[]byte("abc"),
				nil,
				4,
				1,
			},
			false,
		},
		{
			"with nonce",
			"{4,1} YWJj eHl6",
			&VersionedCipher{
				[]byte("abc"),
				[]byte("xyz"),
				4,
				1,
			},
			false,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			v, err := unmarshalVersionedCipher(test.input)

			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}

			if !reflect.DeepEqual(test.expectedResult, v) {
				t.Errorf("Expected %v, got %v", test.expectedResult, v)
			}
		})
	}
}
