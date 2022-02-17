// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

//go:build !windows
// +build !windows

package config

// Config contains all runtime configuration needed for running offen as
// and also defines the desired defaults. Package envconfig is used to
// source values from the application environment at runtime.
type Config struct {
	Server struct {
		Port             int  `default:"3000"`
		ReverseProxy     bool `default:"false"`
		SSLCertificate   EnvString
		SSLKey           EnvString
		AutoTLS          []string
		LetsEncryptEmail string
		CertificateCache EnvString `default:"/var/www/.cache"`
	}
	Database struct {
		Dialect           Dialect   `default:"sqlite3"`
		ConnectionString  EnvString `default:"/var/opt/offen/offen.db"`
		ConnectionRetries int       `default:"0"`
	}
	App struct {
		Development  bool     `default:"false"`
		LogLevel     LogLevel `default:"info"`
		SingleNode   bool     `default:"true"`
		Locale       Locale   `default:"en"`
		RootAccount  string
		DemoAccount  string `ignored:"true"`
		DeployTarget DeployTarget
		Retention    Retention `default:"6months"`
	}
	Secret Bytes
	SMTP   struct {
		User     string
		Password string
		Host     string
		Port     int    `default:"587"`
		Sender   string `default:"no-reply@offen.dev"`
	}
}
