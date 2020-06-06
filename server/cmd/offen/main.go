// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"flag"
	"fmt"
	"os"
)

var mainUsage = `
"offen" makes the following subcommands available:

- "serve" runs the application (this will also run when not providing a subcommand)
- "setup" can be used to setup a new instance
- "secret" can be used to generate runtime secrets
- "demo" starts an ephemeral instance for testing
- "expire" prunes expired events from the database
- "migrate" applies pending database migrations
- "debug" prints the currently applied configuration values

Refer to the -help content of each subcommand for information about how to use
them. Further documentation is available at
https://docs.offen.dev/running-offen/using-the-command/
`

func main() {
	flag.Usage = func() {
		fmt.Fprint(flag.CommandLine.Output(), mainUsage)
	}
	flag.Parse()

	var subcommand string
	var flags []string
	if len(os.Args) > 1 {
		subcommand = os.Args[1]
		flags = os.Args[2:]
	} else {
		subcommand = "serve"
		flags = os.Args[1:]
	}

	switch subcommand {
	case "demo":
		cmdDemo("demo", flags)
	case "serve":
		cmdServe("serve", flags)
	case "setup":
		cmdSetup("setup", flags)
	case "migrate":
		cmdMigrate("migrate", flags)
	case "expire":
		cmdExpire("expire", flags)
	case "debug":
		cmdDebug("debug", flags)
	case "secret":
		cmdSecret("secret", flags)
	case "version":
		cmdVersion("version", flags)
	default:
		fmt.Fprintf(flag.CommandLine.Output(), "Error: unknown subcommand \"%s\"\n", os.Args[1])
		fmt.Fprint(flag.CommandLine.Output(), mainUsage)
		os.Exit(1)
	}
}
