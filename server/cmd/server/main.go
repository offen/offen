package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	httpconfig "github.com/offen/offen/server/config/http"
	"github.com/offen/offen/server/keys/remote"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/router"
	"github.com/sirupsen/logrus"
)

func main() {
	cfg, cfgErr := httpconfig.New()
	if cfgErr != nil {
		log.Fatalf("Error creating runtime configuration: %v", cfgErr)
	}

	logger := logrus.New()
	logger.SetLevel(cfg.LogLevel())

	encryption := remote.New(cfg.EncryptionEndpoint())
	db, err := relational.New(
		relational.WithConnectionString(cfg.ConnectionString()),
		relational.WithEncryption(encryption),
		relational.WithLogging(cfg.Development()),
		relational.WithEmailSalt(os.Getenv("ACCOUNT_USER_EMAIL_SALT")),
	)
	if err != nil {
		logger.WithError(err).Fatal("unable to establish database connection")
	}

	srv := &http.Server{
		Addr: fmt.Sprintf("0.0.0.0:%d", cfg.Port()),
		Handler: router.New(
			router.WithDatabase(db),
			router.WithLogger(logger),
			router.WithSecureCookie(cfg.SecureCookie()),
			router.WithCookieExchangeSecret(cfg.CookieExchangeSecret()),
			router.WithRetentionPeriod(cfg.RetentionPeriod()),
		),
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
