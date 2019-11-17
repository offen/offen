package keys

import (
	"reflect"
	"testing"
)

func TestNewVersionedCipher(t *testing.T) {
	tests := []struct {
		name           string
		cipher         []byte
		algoVersion    int
		keyVersion     int
		expectedResult string
	}{
		{
			"no key version",
			[]byte("abc"),
			1,
			-1,
			"{1,} YWJj",
		},
		{
			"with key version",
			[]byte("abc"),
			2,
			3,
			"{2,3} YWJj",
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			result := NewVersionedCipher(test.cipher, test.algoVersion, test.keyVersion).Marshal()
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
