package relational

import "testing"

func TestAccount_HashUserID(t *testing.T) {
	t.Run("default", func(t *testing.T) {
		account := Account{
			UserSalt: "some-salt-value",
		}
		one := account.HashUserID("user-one")
		two := account.HashUserID("user-two")

		if one == "" {
			t.Error("Unexpected empty string")
		}
		if two == "" {
			t.Error("Unexpected empty string")
		}
		if one == two {
			t.Error("Expected different values for different users")
		}

		otherAccount := Account{
			UserSalt: "other-salt-value",
		}
		otherOne := otherAccount.HashUserID("user-one")

		if one == otherOne {
			t.Error("Expected different values for same user id on different accounts")
		}
	})
}

func TestAccount_WrapPublicKey(t *testing.T) {
	t.Run("default", func(t *testing.T) {
		account := Account{
			PublicKey: `-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEA9wI60PJVATIQ2D8E2WQ7kjAltYg4h9neLkv9PdgA8PnXJB1OEAos
Vpq1p+9l/4NNxIc1rH4nEcDNRkG4vdSBKWiG8Pto4JL3zOONxoofJ1gpi0kB4I0/
aW11GvheVBwLpXhP/W1Sy7LgBQOsNV4iV29KHktrHz0VtEDQaZvIsWSynM13gG6s
ZX0+fnJwnsmKzu+1F5y2ATauSI1YVsLCsyVeigHRZl0MD5lu+RtmeGz9IjgkxZB/
gSnB5slKFhvQNEis8ZVM2k8fNan1mc4WuTv+zbFZH08uecat9HQ9vq1uF/F1LkAF
/F1nsAPIIFB9Z0E5hmpR7dMuUlIcznEeGh5KpXDK841srXdd2sY5bRNHrhkbFR7a
fWF+OFfSXlsmZ+mcH9mTpmoPIdtmFG/mZ0cWOJWwqOVNcrz0FR5/peAkHE0TK9Az
HDwayXQSFXGhATO2xkAUASf1IGiNyTaQNbY4XAzTIfUVqbWa9UV3wrS+1j4dCmaF
jFc4lgREP7fixqmfLDfUaccUK5hO8KuHMkgdQxM+GiQmzpVM9VvgcUXu2QoXWJ9W
bhxontn2+F/6eudVz6RGIDVin7cMrDjkNWkaC7mAzj2xlGNzWXXbiKlmkEhWaa2+
YBf7sFrmjU4gcv62gsDPhYaxJBWOKR41EVXjOf0Zja5UrSfEfsrLOV8CAwEAAQ==
-----END RSA PUBLIC KEY-----`,
		}
		result, err := account.WrapPublicKey()
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if result.KeyType().String() != "RSA" {
			t.Errorf("Expected key type to be RSA, got %s", result.KeyType().String())
		}
	})
	t.Run("bad key", func(t *testing.T) {
		account := Account{
			PublicKey: `-----BEGIN RSA PUBLIC KEY-----
Vpq1p+9l/4NNxIc1rH4nEcDNRkG4vdSBKWiG8Pto4JL3zOONxoofJ1gpi0kB4I0/
-----END RSA PUBLIC KEY-----`,
		}
		result, err := account.WrapPublicKey()
		if result != nil {
			t.Errorf("Unexpected non-nil result %v", result)
		}
		if err == nil {
			t.Error("Expected error, got nil")
		}
	})

	t.Run("malformed key", func(t *testing.T) {
		account := Account{
			PublicKey: "inserting string values nilly willy",
		}
		result, err := account.WrapPublicKey()
		if result != nil {
			t.Errorf("Unexpected non-nil result %v", result)
		}
		if err == nil {
			t.Error("Expected error, got nil")
		}
	})
}
