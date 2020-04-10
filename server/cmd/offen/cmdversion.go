package main

import (
	"flag"
	"fmt"

	"github.com/offen/offen/server/config"
)

var versionUsage = `
"version" prints the tag or revision the binary was built with.
`

func cmdVersion(subcommand string, flags []string) {
	cmd := flag.NewFlagSet(subcommand, flag.ExitOnError)
	cmd.Usage = func() {
		fmt.Fprint(flag.CommandLine.Output(), versionUsage)
		cmd.PrintDefaults()
	}
	newLogger().WithField("revision", config.Revision).Info("Binary built using")
}
