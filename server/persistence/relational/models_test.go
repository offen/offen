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
			PublicKey: `{
  "alg": "RSA-OAEP-256",
  "e": "AQAB",
  "ext": true,
  "key_ops": [
    "encrypt"
  ],
  "kty": "RSA",
  "n": "xc70_877VX8-mm24mfKD7TKCoTnOBUmfIXAnrr2W39XSX_GM-HN0swds8cFyXBdqa-s43QhHb2Ef9-d8iHbdhLKu9jIDeJ3N58Q98ZVd1KAhD6Uqm0whqRuE7B6Q9M1ycAkXb92hMlMff882t47X6QngV1EI8qlMDyujhQ_xqyIItm-mhcVaIg0fBCL-ct0jdRQXQhysPjG24gM_ZzmgsWsUVEC7EER2Z1zyx34varzhYaok1scmhArHoLqJsLNngjYLubqHdMaQ8DCPibHA6bHkIUV9PK0mftWj5UCbv2cRf4gJg0NaeiUQMHKYzA8WL8vJ3ELzIfB219u4UyaCGQ"
}`,
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
