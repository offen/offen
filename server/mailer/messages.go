package mailer

type MessageTemplate string

var MessageForgotPassword MessageTemplate = `
Hi!

You have requested to reset your password. To do so, visit the following link:

{{ .url }}

The link is valid for 24 hours after this email has been sent. In case you have
missed this deadline, you can always request a new link.
`

var MessageNewUserInvite MessageTemplate = `
Hi!

You have been invited to Offen. To accept your invite, visit the following link:

{{ .url }}

The link is valid for 7 days after this email has been sent. In case you have
missed this deadline, request a new invite.
`

var MessageExistingUserInvite MessageTemplate = `
Hi!

You have been added to the following new accounts in Offen:

{{ range .accountNames }}
- {{ . }}
{{ end }}

You automatically gain access to these accounts the next time you log in.
`
