package main

import (
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	"github.com/offen/offen/server/keys/remote"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/router"
	"github.com/sirupsen/logrus"
)

var adapter *httpadapter.HandlerAdapter

func init() {
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)

	postgresConnectionString := os.Getenv("POSTGRES_CONNECTION_STRING")
	encryptionEndpoint := os.Getenv("KMS_ENCRYPTION_ENDPOINT")
	encrypter := remote.New(encryptionEndpoint)

	db, err := relational.New(
		relational.WithDialect("postgres"),
		relational.WithConnectionString(postgresConnectionString),
		relational.WithEncryption(encrypter),
	)
	if err != nil {
		panic(err)
	}

	origin := "*"
	if val, ok := os.LookupEnv("CORS_ORIGIN"); ok {
		origin = val
	}

	_, secureCookie := os.LookupEnv("SECURE_COOKIE")
	optoutCookieDomain := os.Getenv("OPTOUT_COOKIE_DOMAIN")
	jwtPublicKey := os.Getenv("JWT_PUBLIC_KEY")

	rt := router.New(
		router.WithDatabase(db),
		router.WithLogger(logger),
		router.WithSecureCookie(secureCookie),
		router.WithOptoutCookieDomain(optoutCookieDomain),
		router.WithCORSOrigin(origin),
		router.WithJWTPublicKey(jwtPublicKey),
	)
	adapter = httpadapter.New(rt)
}

func main() {
	lambda.Start(adapter.Proxy)
}
