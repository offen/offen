// Copyright 2022 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package config

import (
	"fmt"
	"time"
)

// Retention defines a data retention period.
type Retention struct {
	configured string
	retention  time.Duration
}

// Decode validates and assigns v.
func (r *Retention) Decode(v string) error {
	switch v {
	case "6months":
		*r = Retention{
			configured: v,
			retention:  time.Hour * 24 * 6 * 31,
		}
	case "12weeks":
		*r = Retention{
			configured: v,
			retention:  time.Hour * 24 * 7 * 12,
		}
	case "6weeks":
		*r = Retention{
			configured: v,
			retention:  time.Hour * 24 * 7 * 6,
		}
	case "30days":
		*r = Retention{
			configured: v,
			retention:  time.Hour * 24 * 30,
		}
	case "7days":
		*r = Retention{
			configured: v,
			retention:  time.Hour * 24 * 7,
		}
	default:
		return fmt.Errorf("unknown or unsupported retention period %s", v)
	}
	return nil
}

func (r *Retention) String() string {
	return r.configured
}
