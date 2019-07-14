package keys

import (
	"crypto/x509"
	"encoding/pem"
	"testing"
)

func TestGenerateRSAKeyPair(t *testing.T) {
	t.Run("bad length", func(t *testing.T) {
		_, _, err := GenerateRSAKeypair(-17)
		if err == nil {
			t.Error("Expected error, got nil")
		}
	})
	t.Run("ok", func(t *testing.T) {
		public, private, err := GenerateRSAKeypair(4096)
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}

		privateBlock, _ := pem.Decode(private)
		_, privateErr := x509.ParsePKCS1PrivateKey(privateBlock.Bytes)
		if privateErr != nil {
			t.Errorf("Unexpected error %v", privateErr)
		}

		publicBlock, _ := pem.Decode(public)
		_, publicErr := x509.ParsePKCS1PublicKey(publicBlock.Bytes)
		if publicErr != nil {
			t.Errorf("Unexpected error %v", publicErr)
		}
	})
}
