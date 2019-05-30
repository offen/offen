package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/router"
	"github.com/sirupsen/logrus"
)

func main() {
	var (
		port             = flag.Int("port", 8080, "the port the server binds to")
		connectionString = flag.String("conn", "", "a database connection string")
		dialect          = flag.String("dialect", "postgres", "the database dialect used by the given connection string")
		certFile         = flag.String("cert", "", "the path to a SSL certificate in PEM format")
		keyFile          = flag.String("key", "", "the path to a SSL key in PEM format")
		origin           = flag.String("origin", "*", "the origin used in CORS headers")
		logLevel         = flag.String("level", "info", "the application's log level")
	)
	flag.Parse()

	logger := logrus.New()
	parsedLogLevel, parseErr := logrus.ParseLevel(*logLevel)
	if parseErr != nil {
		logger.WithError(parseErr).Fatalf("unable to parse given log level %s", *logLevel)
	}
	logger.SetLevel(parsedLogLevel)

	db, err := relational.New(
		relational.WithDialect(*dialect),
		relational.WithConnectionString(*connectionString),
	)
	if err != nil {
		logger.WithError(err).Fatal("unable to create database connection")
	}

	srv := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%v", *port),
		Handler: router.New(db, logger, *origin),
	}

	go func() {
		if *certFile != "" && *keyFile != "" {
			if err := srv.ListenAndServeTLS(*certFile, *keyFile); err != nil {
				log.Fatal(err)
			}
		} else {
			if err := srv.ListenAndServe(); err != nil {
				log.Fatal(err)
			}
		}
	}()
	logger.Infof("Server now listening on port %d.", *port)
	quit := make(chan os.Signal)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM, syscall.SIGKILL, syscall.SIGHUP)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal(err.Error())
	}
}
