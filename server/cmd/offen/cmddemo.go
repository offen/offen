// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"syscall"
	"time"

	"github.com/gofrs/uuid"
	"github.com/jinzhu/gorm"
	"github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/locales"
	"github.com/offen/offen/server/persistence"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/public"
	"github.com/offen/offen/server/router"
	"github.com/phayes/freeport"
)

var demoUsage = `
"demo" starts a one-off Offen instance that you can use for testing the software.
You can use the username "demo@offen.dev" with password "demo" to log in.

By default, a random available port will be picked for running the server.
If you need to override this, pass a value to -port.

Usage of "demo":
`

func cmdDemo(subcommand string, flags []string) {
	demoCmd := flag.NewFlagSet(subcommand, flag.ExitOnError)
	demoCmd.Usage = func() {
		fmt.Fprint(flag.CommandLine.Output(), demoUsage)
		demoCmd.PrintDefaults()
	}
	var (
		port  = demoCmd.Int("port", 0, "the port to bind to (defaults to a random available port)")
		empty = demoCmd.Bool("empty", false, "do not populate with random usage data")
	)
	demoCmd.Parse(flags)

	a := newApp(false, true, "")
	{
		dbID, _ := uuid.NewV4()
		cfg, _ := config.New(false, "")
		cfg.Database.Dialect = config.Dialect("sqlite3")
		cfg.Database.ConnectionString = config.EnvString(fmt.Sprintf("/tmp/offen-demo-%s.db", dbID.String()))
		if runtime.GOOS == "windows" {
			cfg.Database.ConnectionString = config.EnvString(fmt.Sprintf("%%Temp%%\\offen-%s.db", dbID.String()))
		}
		cfg.Secrets.CookieExchange = mustSecret(16)
		a.config = cfg
	}

	if *port == 0 {
		freePort, portErr := freeport.GetFreePort()
		if portErr != nil {
			a.logger.WithError(portErr).Fatal("Unable to allocate free port to run demo")
		}
		*port = freePort
	}
	a.config.Server.Port = *port

	accountID, err := uuid.NewV4()
	if err != nil {
		a.logger.WithError(err).Fatal("Unable to create random account identifier")
	}

	gormDB, err := gorm.Open(
		a.config.Database.Dialect.String(),
		a.config.Database.ConnectionString.String(),
	)
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

	if err := db.Migrate(); err != nil {
		a.logger.WithError(err).Fatal("Error applying initial database migrations")
	}
	if err := db.Bootstrap(persistence.BootstrapConfig{
		Accounts: []persistence.BootstrapAccount{
			{AccountID: accountID.String(), Name: "Demo Account"},
		},
		AccountUsers: []persistence.BootstrapAccountUser{
			{
				AdminLevel: persistence.AccountUserAdminLevelSuperAdmin,
				Email:      "demo@offen.dev",
				Password:   "demo",
				Accounts:   []string{accountID.String()},
			},
		},
	}); err != nil {
		a.logger.WithError(err).Fatal("Error bootstrapping database")
	}

	if !*empty {
		a.logger.Info("Offen is generating some random usage data for your demo, this might take a little while.")
		rand.Seed(time.Now().UnixNano())
		account, _ := db.GetAccount(accountID.String(), false, "")

		for i := 0; i < randomInRange(100, 200); i++ {
			userID, key, jwk, err := newFakeUser()
			if err != nil {
				a.logger.WithError(err).Fatal("Error creating fake user data")
			}
			encryptedSecret, encryptionErr := keys.EncryptAsymmetricWith(account.PublicKey, jwk)
			if encryptionErr != nil {
				a.logger.WithError(encryptionErr).Fatal("Error encrypting fake user secret")
			}
			if err := db.AssociateUserSecret(accountID.String(), userID, encryptedSecret.Marshal()); err != nil {
				a.logger.WithError(err).Warn("Error persisting fake user secret")
			}

			for s := 0; s < randomInRange(1, 4); s++ {
				evts := newFakeSession(randomInRange(1, 12))
				for _, evt := range evts {
					b, bErr := json.Marshal(evt)
					if bErr != nil {
						a.logger.WithError(bErr).Fatal("Error marshaling fake event")
					}
					event, eventErr := keys.EncryptWith(key, b)
					if eventErr != nil {
						a.logger.WithError(eventErr).Fatal("Error encrypting fake event payload")
					}
					if err := db.Insert(userID, accountID.String(), event.Marshal()); err != nil {
						a.logger.WithError(err).Warn("Error inserting event")
					}
				}
			}
		}
	}

	fs := public.NewLocalizedFS(a.config.App.Locale.String())
	gettext, gettextErr := locales.GettextFor(a.config.App.Locale.String())
	if gettextErr != nil {
		a.logger.WithError(gettextErr).Fatal("Failed reading locale files, cannot continue")
	}
	tpl, tplErr := fs.HTMLTemplate(gettext)
	if tplErr != nil {
		a.logger.WithError(tplErr).Fatal("Failed parsing template files, cannot continue")
	}
	emails, emailsErr := fs.EmailTemplate(gettext)
	if emailsErr != nil {
		a.logger.WithError(emailsErr).Fatal("Failed parsing template files, cannot continue")
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
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			a.logger.WithError(err).Fatal("Error binding server to network")
		}
	}()
	a.logger.Infof("You can now access your Offfen demo at http://localhost:%d/login/", a.config.Server.Port)
	a.logger.Info(`Use the username "demo@offen.dev" and password "demo" to log in.`)
	a.logger.Info("Data is stored temporarily only for this demo.")
	a.logger.Info("Refer to the documentation on how to connect a persistent database.")

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

func mustSecret(length int) []byte {
	secret, err := keys.GenerateRandomValue(16)
	if err != nil {
		panic(err)
	}
	b, err := base64.StdEncoding.DecodeString(secret)
	if err != nil {
		panic(err)
	}
	return b
}

func newFakeUser() (string, []byte, []byte, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return "", nil, nil, fmt.Errorf("error creating user id: %w", err)
	}
	k, err := keys.GenerateRandomBytes(keys.DefaultSecretLength)
	if err != nil {
		return "", nil, nil, fmt.Errorf("error creating user key: %w", err)
	}
	j, err := jwk.New(k)
	if err != nil {
		return "", nil, nil, fmt.Errorf("error wrapping key as jwk: %w", err)
	}
	j.Set(jwk.AlgorithmKey, "A128GCM")
	j.Set("ext", true)
	j.Set(jwk.KeyOpsKey, []string{jwk.KeyOpEncrypt, jwk.KeyOpDecrypt})
	b, err := json.Marshal(j)
	if err != nil {
		return "", nil, nil, fmt.Errorf("error marshaling jwk: %w", err)
	}
	return id.String(), k, b, nil
}

func randomInRange(lower, upper int) int {
	return rand.Intn(upper-lower) + lower
}

func randomBool(prob float64) bool {
	return prob <= rand.Float64()
}

type fakeEvent struct {
	Type      string    `json:"type"`
	Href      string    `json:"href"`
	Title     string    `json:"title"`
	Referrer  string    `json:"referrer"`
	Pageload  int       `json:"pageload"`
	IsMobile  bool      `json:"isMobile"`
	Timestamp time.Time `json:"timestamp"`
	SessionID string    `json:"sessionId"`
}

var pages = []string{
	"/",
	"/about",
	"/blog",
	"/imprint",
	"/landing-page",
	"/contact",
}

func randomPage() string {
	return pages[randomInRange(0, len(pages)-1)]
}

var referrers = []string{
	"https://www.offen.dev",
	"https://t.co/xyz",
	"https://example.net/?utm_source=Example_Source",
	"https://example.net/?utm_campaign=Example_Campaign",
}

func randomReferrer() string {
	return referrers[randomInRange(0, len(referrers)-1)]
}

func newFakeSession(length int) []*fakeEvent {
	var result []*fakeEvent
	sessionID, _ := uuid.NewV4()
	timestamp := time.Now().Add(-time.Duration(randomInRange(0, int(config.EventRetention))))
	isMobileSession := randomBool(0.33)

	for i := 0; i < length; i++ {
		var referrer string
		if i == 0 && randomBool(0.25) {
			referrer = randomReferrer()
		}
		result = append(result, &fakeEvent{
			Type:      "PAGEVIEW",
			Href:      fmt.Sprintf("%s%s", "https://demo.offen.dev", randomPage()),
			Title:     "Page Title",
			Referrer:  referrer,
			Pageload:  randomInRange(400, 1200),
			IsMobile:  isMobileSession,
			Timestamp: timestamp,
			SessionID: sessionID.String(),
		})
		timestamp = timestamp.Add(time.Duration(randomInRange(0, 10000)))
	}
	return result
}
