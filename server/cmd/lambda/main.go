package main

import (
	"log"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	lambdaconfig "github.com/offen/offen/server/config/lambda"
	"github.com/offen/offen/server/keys/remote"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/router"
	"github.com/sirupsen/logrus"
)

var adapter *httpadapter.HandlerAdapter

func init() {
	cfg, cfgErr := lambdaconfig.New()
	if cfgErr != nil {
		log.Fatalf("Error creating runtime configuration: %v", cfgErr)
	}

	logger := logrus.New()
	logger.SetLevel(cfg.LogLevel())

	encrypter := remote.New(cfg.EncryptionEndpoint())

	db, err := relational.New(
		relational.WithConnectionString(cfg.ConnectionString()),
		relational.WithEncryption(encrypter),
	)
	if err != nil {
		panic(err)
	}

	rt := router.New(
		router.WithDatabase(db),
		router.WithLogger(logger),
		router.WithSecureCookie(cfg.SecureCookie()),
		router.WithOptoutCookieDomain(cfg.OptoutCookieDomain()),
		router.WithCORSOrigin(cfg.CorsOrigin()),
		router.WithJWTPublicKey(cfg.JWTPublicKey()),
		router.WithCookieExchangeSecret(cfg.CookieExchangeSecret()),
		router.WithRetentionPeriod(cfg.RetentionPeriod()),
	)
	adapter = httpadapter.New(rt)
}

func main() {
	lambda.Start(adapter.Proxy)
}
