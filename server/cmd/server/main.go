package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/router"
	"github.com/sirupsen/logrus"
)

func main() {
	var (
		port               = flag.String("port", os.Getenv("PORT"), "the port the server binds to")
		connectionString   = flag.String("conn", os.Getenv("POSTGRES_CONNECTION_STRING"), "a database connection string")
		dialect            = flag.String("dialect", "postgres", "the database dialect used by the given connection string")
		origin             = flag.String("origin", "http://localhost:9977", "the origin used in CORS headers")
		logLevel           = flag.String("level", "info", "the application's log level")
		secureCookie       = flag.Bool("secure", false, "use secure cookies")
		optoutCookieDomain = flag.String("optout", "localhost", "domain value for the optout cookie")
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
		logger.WithError(err).Fatal("unable to establish database connection")
	}

	srv := &http.Server{
		Addr: fmt.Sprintf("0.0.0.0:%s", *port),
		Handler: router.New(
			router.WithDatabase(db),
			router.WithLogger(logger),
			router.WithSecureCookie(*secureCookie),
			router.WithOptoutCookieDomain(*optoutCookieDomain),
			router.WithCORSOrigin(*origin),
		),
	}

	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
