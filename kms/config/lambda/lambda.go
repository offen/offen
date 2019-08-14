package lambda

import (
	"encoding/base64"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/secretsmanager"
	"github.com/offen/offen/kms/config"
)

type lambdaConfig struct {
	keyContent   string
	corsOrigin   string
	jwtPublicKey string
}

func (l *lambdaConfig) KeyContent() string   { return l.keyContent }
func (l *lambdaConfig) CorsOrigin() string   { return l.corsOrigin }
func (l *lambdaConfig) JWTPublicKey() string { return l.jwtPublicKey }

// New creates a new configuration to use when running the application
// in the context of AWS Lambda, sourcing values from both AWS SecretsManager
// and environment variables
func New() (config.Config, error) {
	cfg := lambdaConfig{
		jwtPublicKey: os.Getenv("JWT_PUBLIC_KEY"),
		corsOrigin:   "*",
	}
	if val, ok := os.LookupEnv("CORS_ORIGIN"); ok {
		cfg.corsOrigin = val
	}

	svc := secretsmanager.New(session.New())
	keyContent, keyContentErr := getSecret(svc, "key")
	if keyContentErr != nil {
		return nil, keyContentErr
	}
	cfg.keyContent = keyContent

	return &cfg, nil
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
