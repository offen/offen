package main

import (
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
	a.logger.WithField("config", fmt.Sprintf("%+v", a.config)).Info("Current configuration values")
}
