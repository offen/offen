package main

import (
	"encoding/base64"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	keymanager "github.com/offen/offen/kms/keymanager/local"
	"github.com/offen/offen/kms/router"
	"github.com/sirupsen/logrus"
)

var adapter *httpadapter.HandlerAdapter

func init() {
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)

	manager, err := keymanager.New(func() ([]byte, error) {
		keyContent := os.Getenv("KEY_CONTENT")
		return base64.StdEncoding.DecodeString(keyContent)
	})
	if err != nil {
		panic(err)
	}

	origin := "*"
	if val, ok := os.LookupEnv("CORS_ORIGIN"); ok {
		origin = val
	}

	rt := router.New(
		router.WithCORSOrigin(origin),
		router.WithManager(manager),
		router.WithLogger(logger),
	)

	adapter = httpadapter.New(rt)
}

func main() {
	lambda.Start(adapter.Proxy)
}
