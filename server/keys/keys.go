package keys

// Encrypter can be used to encrypt any value
type Encrypter interface {
	Encrypt(value []byte) ([]byte, error)
}

// this collects default values for key and secret lengths
const (
	RSAKeyLength   = 4096
	UserSaltLength = 16
)
