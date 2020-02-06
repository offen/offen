package config

import "fmt"

// DeployTarget identifies a known deploy target.
type DeployTarget string

// this defines all the known deploy targets that have
// defined exceptions for generating a runtime config.
const (
	DeployTargetHeroku DeployTarget = "heroku"
)

// Decode validates and assigns v.
func (d *DeployTarget) Decode(v string) error {
	switch v {
	case string(DeployTargetHeroku):
		*d = DeployTargetHeroku
	default:
		return fmt.Errorf("config: unknown or unsupported deploy target %s", v)
	}
	return nil
}

func (d *DeployTarget) String() string {
	return string(*d)
}
