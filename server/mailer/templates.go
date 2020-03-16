// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package mailer

import (
	"bytes"
	"fmt"
	"text/template"
)

// RenderMessage renders an email body that is used when sending
// out the link for resetting an account user's password.
func RenderMessage(message MessageTemplate, data interface{}) (string, error) {
	t, err := template.New("body").Parse(string(message))
	if err != nil {
		return "", fmt.Errorf("mailer: error parsing template: %w", err)
	}
	var b []byte
	buf := bytes.NewBuffer(b)
	if err := t.Execute(buf, data); err != nil {
		return "", fmt.Errorf("mailer: error executing template: %w", err)
	}
	return buf.String(), nil
}
