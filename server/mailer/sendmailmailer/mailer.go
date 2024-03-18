// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package sendmailmailer

import (
	"bytes"
	"errors"
	"fmt"
	"os/exec"
	"runtime"

	"github.com/offen/offen/server/mailer"
	"github.com/wneessen/go-mail"
)

// New creates a new Mailer that sends email using a local sendmail installation
func New() (mailer.Mailer, error) {
	return &sendmailMailer{}, nil
}

type sendmailMailer struct{}

func (s *sendmailMailer) Send(from, to, subject, body string) error {
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

	bin, err := lookupSendmail()
	if err != nil {
		return fmt.Errorf("sendmailmailer: error looking up sendmail: %w", err)
	}
	return msg.WriteToSendmailWithCommand(bin)
}

func lookupSendmail() (string, error) {
	if runtime.GOOS == "windows" {
		return "", errors.New("sendmailmailer: using sendmail on windows is currently not supported")
	}
	cmd := exec.Command("which", "sendmail")
	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("sendmailmailer: error looking up sendmail binary: %w", err)
	}
	return string(bytes.TrimSpace(out)), nil

}
