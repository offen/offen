package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	keymanager "github.com/offen/offen/kms/keymanager/local"
	"github.com/offen/offen/kms/router"
	"github.com/sirupsen/logrus"
)

func main() {
	var (
		port     = flag.String("port", os.Getenv("PORT"), "the port the server binds to")
		logLevel = flag.String("level", "info", "the application's log level")
		origin   = flag.String("origin", "http://localhost:9977", "the CORS origin")
		key      = flag.String("jwt", os.Getenv("JWT_PUBLIC_KEY"), "the location of the JWT public key")
	)
	flag.Parse()

	logger := logrus.New()
	parsedLogLevel, parseErr := logrus.ParseLevel(*logLevel)
	if parseErr != nil {
		logger.WithError(parseErr).Fatalf("unable to parse given log level %s", *logLevel)
	}
	logger.SetLevel(parsedLogLevel)

	manager, err := keymanager.New(func() ([]byte, error) {
		keyFile := os.Getenv("KEY_FILE")
		return ioutil.ReadFile(keyFile)
	})

	if err != nil {
		logger.WithError(err).Fatal("error setting up keymanager")
	}
	srv := &http.Server{
		Addr: fmt.Sprintf("0.0.0.0:%s", *port),
		Handler: router.New(
			router.WithManager(manager),
			router.WithLogger(logger),
			router.WithCORSOrigin(*origin),
			router.WithJWTPublicKey(*key),
		),
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
