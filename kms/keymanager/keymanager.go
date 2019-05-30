package keymanager

type Manager interface {
	Encrypt(string) (string, error)
	Decrypt(string) (string, error)
}
