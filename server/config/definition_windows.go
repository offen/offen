// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

//go:build windows
// +build windows

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
		CertificateCache EnvString `default:"%AppData%\offen\.cache"`
	}
	Database struct {
		Dialect           Dialect   `default:"sqlite3"`
		ConnectionString  EnvString `default:"%Temp%\offen.db"`
		ConnectionRetries int       `default:"0"`
	}
	App struct {
		Development   bool     `default:"false"`
		LogLevel      LogLevel `default:"info"`
		SingleNode    bool     `default:"true"`
		Locale        Locale   `default:"en"`
		RootAccount   string
		DemoAccount   string `ignored:"true"`
		DeployTarget  DeployTarget
		RetentionDays int `default:"-1"`
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
