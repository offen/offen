package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
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
		cfg, _ := config.New(false, "")
		cfg.Database.Dialect = config.Dialect("sqlite3")
		cfg.Database.ConnectionString = ":memory:"
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
	a.config.App.RootAccount = accountID.String()

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
			{AccountID: a.config.App.RootAccount, Name: "Demo Account"},
		},
		AccountUsers: []persistence.BootstrapAccountUser{
			{Email: "demo@offen.dev", Password: "demo", Accounts: []string{a.config.App.RootAccount}},
		},
	}); err != nil {
		a.logger.WithError(err).Fatal("Error bootstrapping database")
	}

	if !*empty {
		a.logger.Info("The system is generating some random usage data for you right now, this might take a little.")
		account, _ := db.GetAccount(a.config.App.RootAccount, false, "")
		for i := 0; i < 100; i++ {
			userID, key, jwk := newFakeUser()
			encryptedSecret, encryptionErr := keys.EncryptAsymmetricWith(account.PublicKey, jwk)
			if encryptionErr != nil {
				a.logger.WithError(encryptionErr).Fatal("Error encrypting fake user secret")
			}
			db.AssociateUserSecret(account.AccountID, userID, encryptedSecret.Marshal())
			sessionID, _ := uuid.NewV4()
			fakePayload := fmt.Sprintf(
				`{"type":"PAGEVIEW","href":"http://localhost:%d/","title":"Über – Offen - ✔️","referrer":"","pageload":21,"isMobile":false,"timestamp":"2020-04-11T13:10:10.538Z","sessionId":"%s"}`,
				a.config.Server.Port,
				sessionID.String(),
			)
			event, eventErr := keys.EncryptWith(key, []byte(fakePayload))
			if eventErr != nil {
				a.logger.WithError(eventErr).Fatal("Error encrypting fake event payload")
			}
			db.Insert(userID, account.AccountID, event.Marshal())
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

	srv := &http.Server{
		Addr: fmt.Sprintf("0.0.0.0:%d", a.config.Server.Port),
		Handler: router.New(
			router.WithDatabase(db),
			router.WithLogger(a.logger),
			router.WithTemplate(tpl),
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
	a.logger.Infof("Demo application now serving http://localhost:%d", a.config.Server.Port)
	a.logger.Info(`You can log into the demo account using "demo@offen.dev" and password "demo"`)
	a.logger.Info("Data is stored in-memory only for this demo.")
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

func newFakeUser() (string, []byte, []byte) {
	id, _ := uuid.NewV4()
	k, _ := keys.GenerateRandomBytes(keys.DefaultSecretLength)
	j, _ := jwk.New(k)
	j.Set(jwk.AlgorithmKey, "A128GCM")
	j.Set("ext", true)
	j.Set(jwk.KeyOpsKey, []string{jwk.KeyOpEncrypt, jwk.KeyOpDecrypt})
	b, _ := json.Marshal(j)
	return id.String(), k, b
}
