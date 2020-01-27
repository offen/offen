package persistence

import (
	"strings"
	"testing"
)

func TestBootstrapAccounts(t *testing.T) {
	config := BootstrapConfig{
		Accounts: []BootstrapAccount{
			{
				AccountID: "account-a",
				Name:      "a account",
			},
			{
				AccountID: "account-b",
				Name:      "b account",
			},
		},
		AccountUsers: []BootstrapAccountUser{
			{
				Email:    "a@offen.dev",
				Password: "foobarbaz",
				Accounts: []string{"account-a", "account-b"},
			},
			{
				Email:    "b@offen.dev",
				Password: "foobarbaz",
				Accounts: []string{"account-b"},
			},
		},
	}
	accounts, accountUsers, relationships, err := bootstrapAccounts(&config, []byte("secret-value"))

	if err != nil {
		t.Fatalf("Unexpected error %v", err)
	}

	if len(accounts) != 2 {
		t.Errorf("Unexpected accounts: %v", accounts)
	}

	if len(accountUsers) != 2 {
		t.Errorf("Unexpected account users: %v", accountUsers)
	}

	for _, user := range accountUsers {
		if strings.HasSuffix(user.HashedEmail, "@offen.dev") {
			t.Error("Encountered plain email address when hash was expected")
		}
		if user.HashedPassword == "foobarbaz" {
			t.Error("Encountered plain password when hash was expected")
		}
	}

	if len(relationships) != 3 {
		t.Errorf("Unexpected relationships: %v", relationships)
	}
}
