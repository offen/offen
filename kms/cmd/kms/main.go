package main

import (
	"fmt"
	"log"
	"net/http"

	httpconfig "github.com/offen/offen/kms/config/http"
	keymanager "github.com/offen/offen/kms/keymanager/local"
	"github.com/offen/offen/kms/router"
	"github.com/sirupsen/logrus"
)

func main() {
	cfg, cfgErr := httpconfig.New()
	if cfgErr != nil {
		log.Fatalf("Unable to create runtime configuration: %v", cfgErr)
	}

	logger := logrus.New()
	logger.SetLevel(cfg.LogLevel())

	manager, err := keymanager.New(func() ([]byte, error) {
		return []byte(cfg.KeyContent()), nil
	})

	if err != nil {
		logger.WithError(err).Fatal("error setting up keymanager")
	}
	srv := &http.Server{
		Addr: fmt.Sprintf("0.0.0.0:%d", cfg.Port()),
		Handler: router.New(
			router.WithManager(manager),
			router.WithLogger(logger),
			router.WithCORSOrigin(cfg.CorsOrigin()),
			router.WithJWTPublicKey(cfg.JWTPublicKey()),
		),
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
