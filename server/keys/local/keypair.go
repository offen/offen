package local

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
)

func (*localKeyOps) GenerateRSAKeypair(bits int) ([]byte, []byte, error) {
	key, keyErr := rsa.GenerateKey(rand.Reader, bits)
	if keyErr != nil {
		return nil, nil, keyErr
	}
	public, ok := key.Public().(*rsa.PublicKey)
	if !ok {
		return nil, nil, errors.New("local: error reading public key from private key")
	}
	publicPem := pem.EncodeToMemory(
		&pem.Block{
			Type:  "RSA PUBLIC KEY",
			Bytes: x509.MarshalPKCS1PublicKey(public),
		},
	)
	privatePem := pem.EncodeToMemory(
		&pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: x509.MarshalPKCS1PrivateKey(key),
		},
	)
	return publicPem, privatePem, nil
}
