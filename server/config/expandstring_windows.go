// +build windows

package config

// ExpandString expands all environment variables in the given string
func ExpandString(s string) string {
	r, _ := registry.ExpandString(s)
	return r
}
