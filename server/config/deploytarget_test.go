// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package config

import "testing"

func TestDeployTarget(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		var d DeployTarget
		if err := d.Decode("heroku"); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if d.String() != "heroku" {
			t.Errorf("Unexpected value %v", d.String())
		}
	})
	t.Run("ok", func(t *testing.T) {
		var d DeployTarget
		if err := d.Decode("aol"); err == nil {
			t.Error("Unexpected nil error")
		}
	})
}
