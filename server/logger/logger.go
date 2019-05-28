package logger

import "github.com/sirupsen/logrus"

// Logger wraps logrus.Logger while adding the methods needed to
// implement io.Writer
type Logger struct {
	*logrus.Logger
}

func (l *Logger) Write(b []byte) (int, error) {
	n := len(b)
	if n > 0 && b[n-1] == '\n' {
		b = b[:n-1]
	}
	l.Info(string(b))
	return n, nil
}

// New creates a new Logger
func New() *Logger {
	return &Logger{logrus.New()}
}
