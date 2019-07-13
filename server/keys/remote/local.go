package remote

import (
	"github.com/offen/offen/server/keys"
)

type kmsRemoteEncryption struct {
	encryptionEndpoint string
}

// New returns a new encrypter that uses the remote KMS service to encrypt data
func New(encryptionEndpoint string) keys.Encrypter {
	return &kmsRemoteEncryption{
		encryptionEndpoint: encryptionEndpoint,
	}
}
