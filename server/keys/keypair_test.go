package keys

import (
	"testing"

	"github.com/lestrrat-go/jwx/jwk"
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

		if _, err := jwk.ParseBytes(private); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if _, err := jwk.ParseBytes(public); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
	})
}
