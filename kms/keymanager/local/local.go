package localkeymanager

import (
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
func New(creds func() ([]byte, error)) (keymanager.Manager, error) {
	configstore.RegisterProvider("offen", func() (configstore.ItemList, error) {
		b, err := creds()
		return configstore.ItemList{
			Items: []configstore.Item{
				configstore.NewItem("encryption-key", string(b), 0),
			},
		}, err
	})
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
