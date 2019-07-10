package keys

// KeyOps collects several crypto- and hashing related methods for usage
// throughout the application
type KeyOps interface {
	RemoteEncrypt(value []byte) ([]byte, error)
	GenerateRandomString(length int) (string, error)
	GenerateRSAKeypair(bits int) ([]byte, []byte, error)
}

const (
	RSAKeyLength   = 4096
	UserSaltLength = 16
)
