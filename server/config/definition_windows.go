// +build windows

package config

import "time"

// Config contains all runtime configuration needed for running offen as
// and also defines the desired defaults. Package envconfig is used to
// source values from the application environment at runtime.
type Config struct {
	Server struct {
		Port             int  `default:"8080"`
		ReverseProxy     bool `default:"false"`
		SSLCertificate   EnvString
		SSLKey           EnvString
		AutoTLS          string
		CertificateCache EnvString `default:"%AppData%\offen\.cache"`
	}
	Database struct {
		Dialect          Dialect   `default:"sqlite3"`
		ConnectionString EnvString `default:"%Temp%\offen.db"`
	}
	App struct {
		Development          bool          `default:"false"`
		EventRetentionPeriod time.Duration `default:"4464h"`
		LogLevel             LogLevel      `default:"info"`
		SingleNode           bool          `default:"true"`
		Locale               Locale        `default:"en"`
		RootAccount          string
	}
	Secrets struct {
		CookieExchange Bytes `required:"true"`
		EmailSalt      Bytes `required:"true"`
	}
	SMTP struct {
		User     string
		Password string
		Host     string
		Port     int `default:"587"`
	}
}