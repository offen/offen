// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package sendmailmailer

import (
	"bytes"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"runtime"

	"github.com/go-gomail/gomail"
	"github.com/offen/offen/server/mailer"
)

// New creates a new Mailer that sends email using a local sendmail installation
func New() (mailer.Mailer, error) {
	return &sendmailMailer{}, nil
}

type sendmailMailer struct{}

func (s *sendmailMailer) Send(from, to, subject, body string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", body)

	if err := submitMail(m); err != nil {
		return fmt.Errorf("sendmailmailer: error sending: %w", err)
	}
	return nil
}

func submitMail(m *gomail.Message) error {
	// see: https://stackoverflow.com/a/35521846/797194
	bin, err := lookupSendmail()
	if err != nil {
		return fmt.Errorf("sendmailmailer: error looking up sendmail: %w", err)
	}

	cmd := exec.Command(bin, "-t")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	pw, err := cmd.StdinPipe()
	if err != nil {
		return fmt.Errorf("sendmailmailer: error connecting to pipe: %w", err)
	}

	err = cmd.Start()
	if err != nil {
		return fmt.Errorf("sendmailmailer: error starting command: %w", err)
	}

	var errs [3]error
	_, errs[0] = m.WriteTo(pw)
	errs[1] = pw.Close()
	errs[2] = cmd.Wait()
	for _, err = range errs {
		if err != nil {
			return fmt.Errorf("sendmailmailer: error sending email: %w", err)
		}
	}
	return nil
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
