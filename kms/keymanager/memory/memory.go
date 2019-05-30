package memorykeymanager

import (
	"github.com/offen/offen/kms/keymanager"
)

type memorykeymanager struct {
	secret string
}

func New(secret string) keymanager.Manager {
	return &memorykeymanager{secret}
}

func (m *memorykeymanager) Encrypt(v string) (string, error) {
	return "", nil
}

func (m *memorykeymanager) Decrypt(v string) (string, error) {
	return "", nil
}
