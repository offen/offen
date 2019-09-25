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
	fmt.Printf("From: %s\n", from)
	fmt.Printf("To: %s\n", to)
	fmt.Printf("Subject: %s\n", to)
	fmt.Printf("Body: %s\n", body)
	fmt.Println("=========")
	return nil
}
