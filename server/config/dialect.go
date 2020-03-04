package config

import "fmt"

// Dialect identifies a SQL dialect.
type Dialect string

// Decode validates and assigns v.
func (d *Dialect) Decode(v string) error {
	switch v {
	case "postgres", "sqlite3", "mysql":
		*d = Dialect(v)
	default:
		return fmt.Errorf("unknown or unsupported SQL dialect %s", v)
	}
	return nil
}

func (d *Dialect) String() string {
	return string(*d)
}
