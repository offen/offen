package main

import (
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jasonlvhit/gocron"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/router"
	"github.com/sirupsen/logrus"
)

func main() {
	secretCmd := flag.NewFlagSet("secret", flag.ExitOnError)
	bootstrapCmd := flag.NewFlagSet("bootstrap", flag.ExitOnError)

	if len(os.Args) < 2 {
		os.Args = append(os.Args, "serve")
	}

	logger := logrus.New()

	cfg, cfgErr := config.New()
	if cfgErr != nil {
		logger.WithError(cfgErr).Fatal("Error sourcing runtime configuration")
	}

	logger.SetLevel(cfg.App.LogLevel.LogLevel())

	switch os.Args[1] {
	case "secret":
		var (
			length = secretCmd.Int("length", 16, "the length in bytes")
			count  = secretCmd.Int("count", 1, "the number of secrets to generate")
		)
		secretCmd.Parse(os.Args[2:])
		for i := 0; i < *count; i++ {
			value, err := keys.GenerateRandomValue(*length)
			if err != nil {
				log.Fatalf("Error creating secret: %v", err)
			}
			logger.WithField("secret", value).Infof("Created %d bytes secret", *length)
		}
	case "version":
		logger.WithField("revision", cfg.App.Revision).Info("Current build created using")
	case "bootstrap":
		var (
			migration = bootstrapCmd.Bool("migration", true, "whether to run migrations")
			source    = bootstrapCmd.String("source", "bootstrap.yml", "the configuration file")
		)
		bootstrapCmd.Parse(os.Args[2:])
		read, readErr := ioutil.ReadFile(*source)
		if readErr != nil {
			logger.WithError(readErr).Fatalf("Error reading source file %s", *source)
		}
		db, dbErr := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString)
		if dbErr != nil {
			logger.WithError(dbErr).Fatal("Error establishing database connection")
		}

		if *migration {
			if err := relational.Migrate(db); err != nil {
				logger.WithError(err).Fatal("Error applying database migrations")
			}
		}

		if err := relational.Bootstrap(db, read, cfg.Secrets.EmailSalt.Bytes()); err != nil {
			logger.WithError(err).Fatal("Error bootstrapping database")
		}
		logger.Info("Successfully bootstrapped database")
	case "migrate":
		db, dbErr := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString)
		if dbErr != nil {
			logger.WithError(dbErr).Fatal("Error establishing database connection")
		}
		if err := relational.Migrate(db); err != nil {
			logger.WithError(err).Fatal("Error applying database migrations")
		}
		logger.Info("Successfully ran database migrations")
	case "expire":
		db, dbErr := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString)
		if dbErr != nil {
			logger.WithError(dbErr).Fatal("Error establishing database connection")
		}

		affected, err := relational.Expire(db, cfg.App.EventRetentionPeriod)
		if err != nil {
			logger.WithError(err).Fatalf("Error pruning expired events")
		}
		logger.WithField("removed", affected).Info("Successfully expired events")
	case "serve":
		logger := logrus.New()
		logger.SetLevel(logrus.InfoLevel)

		gormDB, err := gorm.Open(cfg.Database.Dialect.String(), cfg.Database.ConnectionString)
		if err != nil {
			logger.WithError(err).Fatal("Unable to establish database connection")
		}

		db, err := relational.New(
			gormDB,
			relational.WithLogging(cfg.App.Development),
			relational.WithEmailSalt(cfg.Secrets.EmailSalt.Bytes()),
		)
		if err != nil {
			logger.WithError(err).Fatal("Unable to create persistence layer")
		}

		if cfg.App.SingleNode {
			if err := relational.Migrate(gormDB); err != nil {
				logger.WithError(err).Fatal("Error applying database migrations")
			} else {
				logger.Info("Successfully applied database migrations")
			}
		}

		srv := &http.Server{
			Addr: fmt.Sprintf("0.0.0.0:%d", cfg.Server.Port),
			Handler: router.New(
				router.WithDatabase(db),
				router.WithLogger(logger),
				router.WithSecureCookie(!cfg.App.DisableSecureCookie),
				router.WithCookieExchangeSecret(cfg.Secrets.CookieExchange.Bytes()),
				router.WithRetentionPeriod(cfg.App.EventRetentionPeriod),
				router.WithMailer(cfg.NewMailer()),
				router.WithRevision(cfg.App.Revision),
				router.WithReverseProxy(cfg.Server.ReverseProxy),
				router.WithDevelopmentMode(cfg.App.Development),
			),
		}
		go func() {
			if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				logger.WithError(err).Fatal("Error binding server to network")
			}
		}()
		logger.Infof("Server now listening on port %d", cfg.Server.Port)

		if cfg.App.SingleNode {
			scheduler := gocron.NewScheduler()
			scheduler.Every(1).Hours().Do(func() {
				affected, err := relational.Expire(gormDB, cfg.App.EventRetentionPeriod)
				if err != nil {
					logger.WithError(err).Errorf("Error pruning expired events")
					return
				}
				logger.WithField("removed", affected).Info("Cron successfully pruned expired events")
			})
			go func() {
				scheduler.RunAll()
				scheduler.Start()
			}()
		}

		quit := make(chan os.Signal)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
		defer cancel()
		if err := srv.Shutdown(ctx); err != nil {
			logger.WithError(err).Fatal("Error shutting down server")
		}

		select {
		case <-ctx.Done():
			logger.Error("Exceeded context deadline, initiating forceful shutdown")
		}
		logger.Info("Shutting down server")
	default:
		logger.Fatalf("Unknown subcommand %s\n", os.Args[1])
	}
}
