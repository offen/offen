// +build !windows

package config

import "os"

// ExpandString expands all environment variables in the given string
func ExpandString(s string) string {
	return os.ExpandEnv(s)
}
