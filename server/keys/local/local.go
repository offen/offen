package local

import (
	"github.com/offen/offen/server/keys"
)

type localKeyOps struct {
	encryptionEndpoint string
}

func New(encryptionEndpoint string) keys.KeyOps {
	return &localKeyOps{
		encryptionEndpoint: encryptionEndpoint,
	}
}
