// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package mailer

// Mailer is used to send transactional emails
type Mailer interface {
	Send(from, to, subject, body string) error
}
