package localkeymanager

import (
	"fmt"
	"os"

	"github.com/offen/offen/kms/keymanager"
	"github.com/ovh/configstore"
	"github.com/ovh/symmecrypt"
	"github.com/ovh/symmecrypt/keyloader"
)

type memorykeymanager struct {
	key symmecrypt.Key
}

// New creates a new key manager that uses package symmecrypt to
// encrypt and decrypt keys
func New() (keymanager.Manager, error) {
	prefix := os.Getenv("PATH_PREFIX")
	configstore.File(fmt.Sprintf("%skey.txt", prefix))
	k, err := keyloader.LoadKey("offen")
	if err != nil {
		return nil, err
	}

	return &memorykeymanager{k}, nil
}

func (m *memorykeymanager) Encrypt(v []byte) ([]byte, error) {
	b, err := m.key.Encrypt(v)
	if err != nil {
		return nil, err
	}
	return b, err
}

func (m *memorykeymanager) Decrypt(v []byte) ([]byte, error) {
	b, err := m.key.Decrypt(v)
	if err != nil {
		return nil, err
	}
	return b, err
}
