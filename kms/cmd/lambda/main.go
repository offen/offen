package main

import (
	"encoding/base64"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	lambdaconfig "github.com/offen/offen/kms/config/lambda"
	keymanager "github.com/offen/offen/kms/keymanager/local"
	"github.com/offen/offen/kms/router"
	"github.com/sirupsen/logrus"
)

var adapter *httpadapter.HandlerAdapter

func init() {
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)

	cfg, cfgErr := lambdaconfig.New()
	if cfgErr != nil {
		logger.WithError(cfgErr).Fatal("Unable to create runtime configuration")
	}

	manager, err := keymanager.New(func() ([]byte, error) {
		return base64.StdEncoding.DecodeString(cfg.KeyContent())
	})
	if err != nil {
		panic(err)
	}

	rt := router.New(
		router.WithCORSOrigin(cfg.CorsOrigin()),
		router.WithManager(manager),
		router.WithLogger(logger),
		router.WithJWTPublicKey(cfg.JWTPublicKey()),
	)

	adapter = httpadapter.New(rt)
}

func main() {
	lambda.Start(adapter.Proxy)
}
