package localkeymanager

import (
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	prevPrefix := os.Getenv("PATH_PREFIX")
	defer os.Setenv("PATH_PREFIX", prevPrefix)
	os.Setenv("PATH_PREFIX", "testdata/")
	os.Exit(m.Run())
}

func TestMemoryKeyManager_EncryptDecrypt(t *testing.T) {
	val := "this-is-a-string"
	mgr, err := New()
	if err != nil {
		t.Fatalf("Unexpected error %v", err)
	}

	encrypted, err := mgr.Encrypt([]byte(val))
	if err != nil {
		t.Errorf("Unexpected error %v", err)
	}

	if string(encrypted) == val {
		t.Error("Expected cipher to differ from original")
	}

	decrypted, err := mgr.Decrypt(encrypted)
	if err != nil {
		t.Errorf("Unexpected error %v", err)
	}

	if string(decrypted) != val {
		t.Errorf("Expected %v to be returned, got %v", val, string(decrypted))
	}
}
