// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

// +build windows

package config

import (
	"golang.org/x/sys/windows/registry"
)

// ExpandString expands all environment variables in the given string
func ExpandString(s string) string {
	r, _ := registry.ExpandString(s)
	return r
}
