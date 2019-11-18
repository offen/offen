package keys

import (
	"reflect"
	"testing"
)

func TestSymmetricEncryption(t *testing.T) {
	tests := []struct {
		name        string
		generateKey func() ([]byte, error)
	}{
		{
			"random",
			func() ([]byte, error) {
				return GenerateEncryptionKey(DefaultEncryptionKeySize)
			},
		},
		{
			"derived",
			func() ([]byte, error) {
				return DeriveKey("mypassword", []byte("abc123"))
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			key, err := test.generateKey()
			if err != nil {
				t.Fatalf("Unexpected error genrating key")
			}
			value := []byte("much encryption, so wow")
			versionedCipher, err := EncryptWith(key, value)
			if err != nil {
				t.Fatalf("Unexpected error encrypting value")
			}
			plaintext, err := DecryptWith(key, versionedCipher.Marshal())
			if err != nil {
				t.Fatalf("Unexpected error decrypting value: %v", versionedCipher.Marshal())
			}
			if !reflect.DeepEqual(value, plaintext) {
				t.Errorf("Expected decrypted value to match original, got %s", string(plaintext))
			}
		})
	}
}

func TestHashPassword(t *testing.T) {
	hash, hashErr := HashPassword("s3cr3t")
	if hashErr != nil {
		t.Fatalf("Unexpected error %v", hashErr)
	}
	if err := ComparePassword("s3cr3t", hash.Marshal()); err != nil {
		t.Errorf("Unexpected error %v", err)
	}
	if err := ComparePassword("other", hash.Marshal()); err == nil {
		t.Errorf("Comparison unexpectedly passed for wrong password")
	}
}

func TestHashEmail(t *testing.T) {
	hash1, err := HashEmail("foo@bar.com", []byte("abc"))
	hash2, err := HashEmail("bar@foo.com", []byte("abc"))
	hash3, err := HashEmail("foo@bar.com", []byte("xyz"))
	if err != nil {
		t.Fatalf("Unexpected error %v", err)
	}
	if string(hash1) == "foo@bar.com" {
		t.Error("Expected hash to be different than original value.")
	}
	if reflect.DeepEqual(hash1, hash2) {
		t.Error("Expected hashes to be different, 1 and 2 matched")
	}
	if reflect.DeepEqual(hash1, hash3) {
		t.Error("Expected hashes to be different, 1 and 3 matched")
	}
	if reflect.DeepEqual(hash2, hash3) {
		t.Error("Expected hashes to be different, 2 and 3 matched")
	}
}
