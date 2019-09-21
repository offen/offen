package mailer

import (
	"bytes"
	"fmt"
	"text/template"
)

var tpl = `
You have requested to reset your password. To do so, visit the following link:

{{ .url }}

The link is valid for 24 hours after this email has been sent. In case you have
missed this deadline, you can always request a new link.
`

// RenderForgotPasswordMessage renders an email body that is used when sending
// out the link for resetting an account user's password.
func RenderForgotPasswordMessage(values interface{}) (string, error) {
	t, err := template.New("body").Parse(tpl)
	if err != nil {
		return "", err
	}
	var b []byte
	buf := bytes.NewBuffer(b)
	if err := t.Execute(buf, values); err != nil {
		return "", fmt.Errorf("error executing template: %v", err)
	}
	return buf.String(), nil
}
