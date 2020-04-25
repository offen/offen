// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package mailer

type MessageTemplate string

var SubjectForgotPassword MessageTemplate = `Reset your password`
var MessageForgotPassword MessageTemplate = `
Hi!

You have requested to reset your password. To do so, visit the following link:

{{ .url }}

The link is valid for 24 hours after this email has been sent. In case you have
missed this deadline, you can always request a new link.
`

var SubjectNewUserInvite MessageTemplate = `You have been invited to join Offen`
var MessageNewUserInvite MessageTemplate = `
Hi!

You have been invited to Offen. To accept your invite, visit the following link:

{{ .url }}

The link is valid for 7 days after this email has been sent. In case you have
missed this deadline, request a new invite.
`

var SubjectExistingUserInvite MessageTemplate = `You have been added to additional accounts on Offen`
var MessageExistingUserInvite MessageTemplate = `
Hi!

You have been added to the following new accounts in Offen:

{{ range .accountNames }}
- {{ . }}
{{ end }}

You automatically gain access to these accounts the next time you log in.
`
