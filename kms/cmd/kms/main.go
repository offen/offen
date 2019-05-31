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

	keymanager "github.com/offen/offen/kms/keymanager/local"
	"github.com/offen/offen/kms/router"
	"github.com/sirupsen/logrus"
)

func main() {
	var (
		port     = flag.Int("port", 8080, "the port the server binds to")
		certFile = flag.String("cert", "", "the path to a SSL certificate in PEM format")
		keyFile  = flag.String("key", "", "the path to a SSL key in PEM format")
		logLevel = flag.String("level", "info", "the application's log level")
	)
	flag.Parse()

	logger := logrus.New()
	parsedLogLevel, parseErr := logrus.ParseLevel(*logLevel)
	if parseErr != nil {
		logger.WithError(parseErr).Fatalf("unable to parse given log level %s", *logLevel)
	}
	logger.SetLevel(parsedLogLevel)

	manager, err := keymanager.New()
	if err != nil {
		logger.WithError(err).Fatal("error setting up keymanager")
	}
	srv := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%v", *port),
		Handler: router.New(manager, logger),
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
	logger.Infof("KMS server now listening on port %d.", *port)
	quit := make(chan os.Signal)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM, syscall.SIGKILL, syscall.SIGHUP)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal(err.Error())
	}
}
