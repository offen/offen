package main

import (
	"fmt"
	"log"
	"net/http"

	httpconfig "github.com/offen/offen/server/config/http"
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

	db, err := relational.New(
		relational.WithConnectionString(cfg.ConnectionString()),
		relational.WithLogging(cfg.Development()),
		relational.WithEmailSalt(cfg.AccountUserSalt()),
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
			router.WithMailer(cfg.Mailer()),
		),
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
