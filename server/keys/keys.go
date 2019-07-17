package keys

// Encrypter can be used to encrypt any value into a cipher text.
// Implementors are free to chose which backend is used for doing so.
type Encrypter interface {
	Encrypt(value []byte) ([]byte, error)
}

// these constants collect default values for key and secret lengths
const (
	RSAKeyLength   = 4096
	UserSaltLength = 16
)
