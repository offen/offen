// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package main

import (
	"encoding/json"
	"flag"
	"fmt"
)

var debugUsage = `
"debug" prints the runtime configuration resolved from the current working
directory.

Usage of "debug":
`

func cmdDebug(subcommand string, flags []string) {
	cmd := flag.NewFlagSet("debug", flag.ExitOnError)
	cmd.Usage = func() {
		fmt.Fprint(flag.CommandLine.Output(), debugUsage)
		cmd.PrintDefaults()
	}
	var (
		envFile = cmd.String("envfile", "", "the env file to use")
	)
	cmd.Parse(flags)
	a := newApp(false, true, *envFile)
	pretty, err := json.MarshalIndent(a.config, "", "  ")
	if err != nil {
		a.logger.WithError(err).Fatal("Error pretty printing config")
	}
	a.logger.Info("Current configuration values")
	fmt.Fprintln(a.logger.Out, string(pretty))
}
