package main

import (
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/router"
	"github.com/sirupsen/logrus"
)

var adapter *httpadapter.HandlerAdapter

func init() {
	logger := logrus.New()
	logger.SetLevel(logrus.InfoLevel)

	db, err := relational.New(
		relational.WithDialect("postgres"),
		relational.WithConnectionString(os.Getenv("POSTGRES_CONNECTION_STRING")),
	)
	if err != nil {
		panic(err)
	}

	origin := "*"
	if val, ok := os.LookupEnv("CORS_ORIGIN"); ok {
		origin = val
	}

	_, secureCookies := os.LookupEnv("SECURE_COOKIE")
	optoutCookieDomain := os.Getenv("OPTOUT_COOKIE_DOMAIN")

	rt := router.New(db, logger, secureCookies, optoutCookieDomain, origin)
	adapter = httpadapter.New(rt)
}

func main() {
	lambda.Start(adapter.Proxy)
}
