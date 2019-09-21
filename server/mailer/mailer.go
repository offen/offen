package mailer

// Mailer is used to send transactional emails
type Mailer interface {
	Send(from, to, subject, body string) error
}
