// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/locales"
	"github.com/offen/offen/server/persistence"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/public"
	"github.com/offen/offen/server/router"
	"golang.org/x/crypto/acme/autocert"
)

var serveUsage = `
"serve" starts the Offen instance and listens to the configured ports.
Configuration is sourced either from the envfile given to -envfile or a file
called offen.env in the default lookup hierarchy (this applies to Linux and
Darwin only):

- In the current working directory
- In ~/.config
- In $XDG_CONFIG_HOME
- In /etc/offen

In case no envfile is found or given, the environment variables already set are
used. More documentation about configuration Offen can be found at:
https://docs.offen.dev/running-offen/configuring-the-application/

Usage of "serve":
`

func cmdServe(subcommand string, flags []string) {
	cmd := flag.NewFlagSet(subcommand, flag.ExitOnError)
	cmd.Usage = func() {
		fmt.Fprint(flag.CommandLine.Output(), serveUsage)
		cmd.PrintDefaults()
	}
	var (
		envFile = cmd.String("envfile", "", "the env file to use")
	)
	cmd.Parse(flags)
	a := newApp(false, false, *envFile)

	gormDB, err := gorm.Open(a.config.Database.Dialect.String(), a.config.Database.ConnectionString.String())
	if err != nil {
		a.logger.WithError(err).Fatal("Unable to establish database connection")
	}
	gormDB.LogMode(a.config.App.Development)

	db, err := persistence.New(
		relational.NewRelationalDAL(gormDB),
	)
	if err != nil {
		a.logger.WithError(err).Fatal("Unable to create persistence layer")
	}

	if a.config.App.SingleNode {
		if err := db.Migrate(); err != nil {
			a.logger.WithError(err).Fatal("Error applying database migrations")
		} else {
			a.logger.Info("Successfully applied database migrations")
		}
	}

	fs := public.NewLocalizedFS(a.config.App.Locale.String())
	gettext, gettextErr := locales.GettextFor(a.config.App.Locale.String())
	if gettextErr != nil {
		a.logger.WithError(gettextErr).Fatal("Failed reading locale files, cannot continue")
	}
	tpl, tplErr := public.HTMLTemplate(gettext, public.RevWith(fs))
	if tplErr != nil {
		a.logger.WithError(tplErr).Fatal("Failed parsing template files, cannot continue")
	}
	emails, emailErr := public.EmailTemplate(gettext)
	if emailErr != nil {
		a.logger.WithError(emailErr).Fatal("Failed parsing template files, cannot continue")
	}

	srv := &http.Server{
		Addr: fmt.Sprintf("0.0.0.0:%d", a.config.Server.Port),
		Handler: router.New(
			router.WithDatabase(db),
			router.WithLogger(a.logger),
			router.WithTemplate(tpl),
			router.WithEmails(emails),
			router.WithConfig(a.config),
			router.WithFS(fs),
			router.WithMailer(a.config.NewMailer()),
		),
	}
	go func() {
		if a.config.Server.SSLCertificate != "" && a.config.Server.SSLKey != "" {
			err := srv.ListenAndServeTLS(a.config.Server.SSLCertificate.String(), a.config.Server.SSLKey.String())
			if err != nil && err != http.ErrServerClosed {
				a.logger.WithError(err).Fatal("Error binding server to network")
			}
		} else if len(a.config.Server.AutoTLS) != 0 {
			m := autocert.Manager{
				Prompt:     autocert.AcceptTOS,
				HostPolicy: autocert.HostWhitelist(a.config.Server.AutoTLS...),
				Cache:      autocert.DirCache(a.config.Server.CertificateCache),
			}
			go http.ListenAndServe(":http", m.HTTPHandler(nil))
			if err := http.Serve(m.Listener(), srv.Handler); err != nil && err != http.ErrServerClosed {
				a.logger.WithError(err).Fatal("Error binding server to network")
			}
		} else {
			if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				a.logger.WithError(err).Fatal("Error binding server to network")
			}
		}
	}()
	if len(a.config.Server.AutoTLS) != 0 {
		a.logger.Info("Server now listening on port 80 and 443 using AutoTLS")
	} else {
		a.logger.Infof("Server now listening on port %d", a.config.Server.Port)
	}

	if a.config.App.SingleNode {
		hourlyJob := time.Tick(time.Hour)
		runOnInit := make(chan bool)
		go func() {
			for {
				select {
				case <-hourlyJob:
				case <-runOnInit:
				}
				affected, err := db.Expire(config.EventRetention)
				if err != nil {
					a.logger.WithError(err).Errorf("Error pruning expired events")
					return
				}
				a.logger.WithField("removed", affected).Info("Cron successfully pruned expired events")
			}
		}()
		runOnInit <- true
	}

	quit := make(chan os.Signal)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		a.logger.WithError(err).Fatal("Error shutting down server")
	}

	a.logger.Info("Gracefully shut down server")
}
