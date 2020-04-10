package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/offen/offen/server/keys"
)

var secretUsage = `
"secret" can be used to generate Base64-encoded random secrets for signing
cookies or similar. The default length of 16 is a good default value for
generating a value to use as OFFEN_SECRETS_COOKIEEXCHANGE.

Usage of "secret":
`

func cmdSecret(subcommand string, flags []string) {
	cmd := flag.NewFlagSet(subcommand, flag.ExitOnError)
	cmd.Usage = func() {
		fmt.Fprint(flag.CommandLine.Output(), secretUsage)
		cmd.PrintDefaults()
	}
	var (
		length = cmd.Int("length", keys.DefaultSecretLength, "the length in bytes")
		count  = cmd.Int("count", 1, "the number of secrets to generate")
		quiet  = cmd.Bool("quiet", false, "only print secrets")
	)
	cmd.Parse(flags)

	l := newLogger()
	for i := 0; i < *count; i++ {
		value, err := keys.GenerateRandomValue(*length)
		if err != nil {
			log.Fatalf("Error creating secret: %v", err)
		}
		if *quiet {
			fmt.Println(value)
		} else {
			l.WithField("secret", value).Infof("Created %d bytes secret", *length)
		}
	}
}
