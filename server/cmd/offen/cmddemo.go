// Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
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
	"sync"
	"syscall"
	"time"

	"github.com/gofrs/uuid"
	"github.com/lestrrat-go/jwx/jwk"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/locales"
	"github.com/offen/offen/server/persistence"
	"github.com/offen/offen/server/persistence/relational"
	"github.com/offen/offen/server/public"
	"github.com/offen/offen/server/router"
	"github.com/phayes/freeport"
	"github.com/schollz/progressbar/v3"
)

var demoUsage = `
"demo" starts a one-off Offen instance that you can use for testing the software
on your local machine. You can use the username "demo@offen.dev" with password
"demo" to log in. Depending on your setup, generation of random usage data might
take a minute or two.

By default, a random free port will be picked for running the server.
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
		port     = demoCmd.Int("port", 0, "the port to bind to (defaults to a random free port)")
		numUsers = demoCmd.Int("users", -1, "the number of users to simulate - this defaults to a random number between 250 and 500")
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
		cfg.Secret = mustSecret(16)
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
	a.config.App.DemoAccount = accountID.String()

	gormDB, err := newDB(a.config, a.logger)
	if err != nil {
		a.logger.WithError(err).Fatal("Unable to establish database connection")
	}
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
				AdminLevel:            persistence.AccountUserAdminLevelSuperAdmin,
				Email:                 "demo@offen.dev",
				Password:              "demo",
				Accounts:              []string{accountID.String()},
				AllowInsecurePassword: true,
			},
		},
	}); err != nil {
		a.logger.WithError(err).Fatal("Error bootstrapping database")
	}

	a.logger.Info("Offen is generating some random usage data for your demo, this might take a little while.")
	rand.Seed(time.Now().UnixNano())
	account, _ := db.GetAccount(accountID.String(), false, false, "")

	users := *numUsers
	if users == -1 {
		users = randomInRange(250, 500)
	}

	wg := sync.WaitGroup{}
	done := make(chan error)
	wg.Add(users)
	pBar := progressbar.NewOptions(users, progressbar.OptionClearOnFinish())

	for i := 0; i < users; i++ {
		go func() {
			userID, key, jwk, err := newFakeUser()
			if err != nil {
				done <- err
				return
			}
			encryptedSecret, encryptionErr := keys.EncryptAsymmetricWith(
				account.PublicKey, jwk,
			)
			if encryptionErr != nil {
				done <- err
				return
			}
			if err := db.AssociateUserSecret(
				accountID.String(), userID, encryptedSecret.Marshal(),
			); err != nil {
				done <- err
			}

			for s := 0; s < randomInRange(1, 4); s++ {
				evts := newFakeSession(
					fmt.Sprintf("http://localhost:%d", a.config.Server.Port),
					randomInRange(1, 12),
				)
				for _, evt := range evts {
					b, bErr := json.Marshal(evt)
					if bErr != nil {
						done <- err
					}
					event, eventErr := keys.EncryptWith(key, b)
					if eventErr != nil {
						done <- err
					}
					eventID, _ := persistence.EventIDAt(evt.Timestamp)
					if err := db.Insert(
						userID,
						accountID.String(),
						event.Marshal(),
						&eventID,
					); err != nil {
						done <- err
					}
				}
			}
			wg.Done()
			pBar.Add(1)
		}()
	}

	go func() {
		wg.Wait()
		done <- nil
	}()

	select {
	case err := <-done:
		if err != nil {
			a.logger.WithError(err).Fatal("Error setting up demo")
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
	a.logger.Infof("You can now start your Offen demo by visiting")
	a.logger.Infof("")
	a.logger.Infof("--> http://localhost:%d/intro/ <--", a.config.Server.Port)
	a.logger.Infof("")
	a.logger.Infof("in your browser. Please make sure to use the `localhost`")
	a.logger.Infof("hostname so a secure context is available.")

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
	j.Set(jwk.KeyOpsKey, jwk.KeyOperationList{jwk.KeyOpEncrypt, jwk.KeyOpDecrypt})
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
	Geo       string    `json:"geo"`
	Referrer  string    `json:"referrer"`
	Pageload  int       `json:"pageload"`
	IsMobile  bool      `json:"isMobile"`
	Timestamp time.Time `json:"timestamp"`
	SessionID string    `json:"sessionId"`
}

var pages = []string{
	"/",
	"/about/",
	"/blog/",
	"/imprint/",
	"/landing-page/",
	"/landing-page/?utm_source=Example_Source",
	"/landing-page/?utm_campaign=Example_Campaign",
	"/intro/",
	"/contact/",
}

func randomPage() string {
	return pages[randomInRange(0, len(pages)-1)]
}

var referrers = []string{
	"https://www.offen.dev",
	"https://t.co/xyz",
	"https://example.net/",
}

func randomReferrer() string {
	return referrers[randomInRange(0, len(referrers)-1)]
}

func newFakeSession(root string, length int) []*fakeEvent {
	var result []*fakeEvent
	sessionID, _ := uuid.NewV4()
	timestamp := time.Now().Add(-time.Duration(randomInRange(0, int(config.EventRetention))))
	isMobileSession := randomBool(0.33)
	countryCode := randomCountryCode()

	var href string
	for i := 0; i < length; i++ {
		var referrer string
		if i == 0 && randomBool(0.25) {
			referrer = randomReferrer()
		} else if i != 0 {
			// a subsequent view will use the previously visited URL
			// as the referrer
			referrer = href
		}

		href := fmt.Sprintf("%s%s", root, randomPage())
		result = append(result, &fakeEvent{
			Type:      "PAGEVIEW",
			Href:      href,
			Geo:       countryCode,
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

var countryCodes = []string{"AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "UA", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"}

func randomCountryCode() string {
	return countryCodes[randomInRange(0, len(countryCodes)-1)]
}
