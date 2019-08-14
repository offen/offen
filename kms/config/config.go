package config

// Config gathers all configuration values that can be set when running
// the KMS application. Each possible runtime is supposed to implement the
// interface by itself.
type Config interface {
	KeyContent() string
	CorsOrigin() string
	JWTPublicKey() string
}
