package lambda

import (
	"encoding/base64"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/secretsmanager"
	"github.com/offen/offen/server/config"
	"github.com/sirupsen/logrus"
)

type lambdaConfig struct {
	sync.Mutex
	connectionString     string
	corsOrigin           string
	optoutCookieDomain   string
	jwtPublicKey         string
	encryptionEndpoint   string
	cookieExchangeSecret string
	retentionPeriod      time.Duration
}

func (l *lambdaConfig) Port() int                      { return 0 }
func (l *lambdaConfig) ConnectionString() string       { return l.connectionString }
func (l *lambdaConfig) CorsOrigin() string             { return l.corsOrigin }
func (l *lambdaConfig) LogLevel() logrus.Level         { return logrus.InfoLevel }
func (l *lambdaConfig) OptoutCookieDomain() string     { return l.optoutCookieDomain }
func (l *lambdaConfig) JWTPublicKey() string           { return l.jwtPublicKey }
func (l *lambdaConfig) SecureCookie() bool             { return true }
func (l *lambdaConfig) EncryptionEndpoint() string     { return l.encryptionEndpoint }
func (l *lambdaConfig) Development() bool              { return false }
func (l *lambdaConfig) CookieExchangeSecret() string   { return l.cookieExchangeSecret }
func (l *lambdaConfig) RetentionPeriod() time.Duration { return l.retentionPeriod }

// New creates a new configuration for use in the context of AWS Lambda
func New() (config.Config, error) {
	cfg := lambdaConfig{
		encryptionEndpoint: os.Getenv("KMS_ENCRYPTION_ENDPOINT"),
		corsOrigin:         "*",
		optoutCookieDomain: os.Getenv("OPTOUT_COOKIE_DOMAIN"),
		jwtPublicKey:       os.Getenv("JWT_PUBLIC_KEY"),
	}

	if override, ok := os.LookupEnv("CORS_ORIGIN"); ok {
		cfg.corsOrigin = override
	}

	retention, retentionErr := time.ParseDuration(os.Getenv("EVENT_RETENTION_PERIOD"))
	if retentionErr != nil {
		return nil, retentionErr
	}
	cfg.retentionPeriod = retention

	errors := make(chan error)
	done := make(chan struct{})
	go func() {
		svc := secretsmanager.New(session.New())
		wg := sync.WaitGroup{}
		wg.Add(2)

		go func() {
			defer wg.Done()
			connectionString, err := getSecret(svc, "postgresConnectionString")
			if err != nil {
				errors <- err
				return
			}
			cfg.Lock()
			cfg.connectionString = connectionString
			cfg.Unlock()
		}()

		go func() {
			defer wg.Done()
			cookieExchangeSecret, err := getSecret(svc, "cookieExchangeSecret")
			if err != nil {
				errors <- err
				return
			}
			cfg.Lock()
			cfg.cookieExchangeSecret = cookieExchangeSecret
			cfg.Unlock()
		}()
		wg.Wait()
		close(done)
	}()

	select {
	case err := <-errors:
		return nil, err
	case <-done:
		return &cfg, nil
	}
}

func getSecret(svc *secretsmanager.SecretsManager, secretID string) (string, error) {
	input := &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(fmt.Sprintf("%s/kms/%s", os.Getenv("STAGE"), secretID)),
	}
	result, err := svc.GetSecretValue(input)
	if err != nil {
		return "", err
	}
	if result.SecretString != nil {
		return *result.SecretString, nil
	}
	decodedBinarySecretBytes := make([]byte, base64.StdEncoding.DecodedLen(len(result.SecretBinary)))
	len, err := base64.StdEncoding.Decode(decodedBinarySecretBytes, result.SecretBinary)
	if err != nil {
		return "", err
	}
	return string(decodedBinarySecretBytes[:len]), nil
}
