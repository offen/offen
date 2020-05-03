// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package smtpmailer

import (
	"github.com/go-gomail/gomail"
	"github.com/offen/offen/server/mailer"
)

// New creates a new Mailer that sends email using the given SMTP configuration
func New(endpoint, user, password string, port int) mailer.Mailer {
	d := gomail.NewDialer(endpoint, port, user, password)
	return &smtpMailer{d}
}

type smtpMailer struct {
	*gomail.Dialer
}

func (s *smtpMailer) Send(from, to, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)
	return s.DialAndSend(m)
}
