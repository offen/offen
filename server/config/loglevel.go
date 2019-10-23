package config

import (
	"github.com/sirupsen/logrus"
)

// LogLevel is a wrapped logrus log level
type LogLevel logrus.Level

// Decode parses a string into l.
func (l *LogLevel) Decode(v string) error {
	p, err := logrus.ParseLevel(v)
	if err != nil {
		return err
	}
	*l = LogLevel(p)
	return nil
}

// LogLevel unwraps l.
func (l *LogLevel) LogLevel() logrus.Level {
	return logrus.Level(*l)
}
