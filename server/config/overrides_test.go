// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"bytes"
	"os"
	"testing"
)

func TestApplyHerokuSpecificOverrides(t *testing.T) {
	fixtures := map[string]string{
		"DATABASE_URL":         "https://my.postgres:5432",
		"PORT":                 "9999",
		"HEROKU_COOKIE_SECRET": "abcdefghijk",
	}
	for key, value := range fixtures {
		defer os.Setenv(key, os.Getenv(key))
		os.Setenv(key, value)
	}

	c := &Config{}
	c.Server.Port = 5555
	c.Database.ConnectionString = "/tmp/db.sqlite"
	c.Secrets.CookieExchange = []byte("123456789")
	c.Server.AutoTLS = []string{"www.offen.dev"}

	if err := applyHerokuSpecificOverrides(c); err != nil {
		t.Errorf("Unexpected error %v", err)
	}

	if c.Database.ConnectionString != "https://my.postgres:5432" {
		t.Errorf("Unexpected connection string value %v", c.Database.ConnectionString)
	}

	if c.Server.Port != 9999 {
		t.Errorf("Unexpected port value %v", c.Server.Port)
	}

	if !bytes.Equal(c.Secrets.CookieExchange.Bytes(), []byte("abcdefghijk")) {
		t.Errorf("Unexpected cookie secret %v", c.Secrets.CookieExchange.Bytes())
	}

	if c.Server.AutoTLS[0] != "www.offen.dev" {
		t.Errorf("Unexpected AutoTLS config %v", c.Server.AutoTLS)
	}
}
