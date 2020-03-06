// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

// +build !windows

package config

import "os"

// ExpandString expands all environment variables in the given string
func ExpandString(s string) string {
	return os.ExpandEnv(s)
}
