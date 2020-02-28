package persistence

import (
	"strings"
	"testing"
)

type mockProbeDatabase struct {
	DataAccessLayer
	result bool
}

func (m *mockProbeDatabase) ProbeEmpty() bool {
	return m.result
}

func TestProbeEmpty(t *testing.T) {
	p := persistenceLayer{&mockProbeDatabase{result: true}}
	result := p.ProbeEmpty()
	if result != true {
		t.Errorf("Expected true, got %v", result)
	}
}
func TestBootstrapAccounts(t *testing.T) {
	config := BootstrapConfig{
		Accounts: []BootstrapAccount{
			{
				AccountID: "235e2949-3ecb-4c2c-9edb-ee99b7431cb3",
				Name:      "a account",
			},
			{
				AccountID: "9d2c215d-e1f2-4118-a53e-d83f0d64219b",
				Name:      "b account",
			},
		},
		AccountUsers: []BootstrapAccountUser{
			{
				Email:    "a@offen.dev",
				Password: "foobarbaz",
				Accounts: []string{"235e2949-3ecb-4c2c-9edb-ee99b7431cb3", "9d2c215d-e1f2-4118-a53e-d83f0d64219b"},
			},
			{
				Email:    "b@offen.dev",
				Password: "foobarbaz",
				Accounts: []string{"9d2c215d-e1f2-4118-a53e-d83f0d64219b"},
			},
		},
	}
	accounts, accountUsers, relationships, err := bootstrapAccounts(&config)

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
