// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package smtpmailer

import (
	"errors"
	"fmt"
	"github.com/offen/offen/server/mailer"
	"github.com/wneessen/go-mail"
	"strings"
)

// New creates a new Mailer that sends email using the given SMTP configuration
func New(endpoint, user, password, authtype string, port int) (mailer.Mailer, error) {
	c, err := mail.NewClient(endpoint, mail.WithPort(port), mail.WithUsername(user),
		mail.WithPassword(password))
	if err != nil {
		return nil, fmt.Errorf("failed to initialize SMTP client: %w", err)
	}

	// Set SMTP Auth type
	switch strings.ToLower(authtype) {
	case "login":
		c.SetSMTPAuth(mail.SMTPAuthLogin)
	case "plain":
		c.SetSMTPAuth(mail.SMTPAuthPlain)
	case "cram-md5":
		c.SetSMTPAuth(mail.SMTPAuthCramMD5)
	default:
		return nil, errors.New("configured SMTP auth type is not supported")
	}

	return &smtpMailer{c}, nil
}

type smtpMailer struct {
	*mail.Client
}

func (s *smtpMailer) Send(from, to, subject, body string) error {
	msg := mail.NewMsg()
	if err := msg.From(from); err != nil {
		return fmt.Errorf("failed to set mail FROM: %w", err)
	}
	if err := msg.To(to); err != nil {
		return fmt.Errorf("failed to set mail TO: %w", err)
	}
	msg.Subject(subject)
	msg.SetBodyString(mail.TypeTextPlain, body)
	msg.SetUserAgent("Offen Fair Web Analytics")

	return s.DialAndSend(msg)
}
