// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package localmailer

import (
	"fmt"

	"github.com/offen/offen/server/mailer"
)

// New creates a new Mailer that prints the mail to stdout instead of sending
// actual email. It is supposed to be used in development only.
func New() mailer.Mailer {
	return &localMailer{}
}

type localMailer struct{}

func (*localMailer) Send(from, to, subject, body string) error {
	fmt.Println("=========")
	fmt.Printf("From: %s\n", from)       // lgtm [go/log-injection]
	fmt.Printf("To: %s\n", to)           // lgtm [go/log-injection]
	fmt.Printf("Subject: %s\n", subject) // lgtm [go/log-injection]
	fmt.Printf("Body: %s\n", body)       // lgtm [go/log-injection]
	fmt.Println("=========")
	return nil
}
