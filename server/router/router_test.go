package router

import (
	"testing"

	"github.com/offen/offen/server/persistence"
)

type mockDatabase struct {
	persistence.Database
}

func TestNew(t *testing.T) {
	New(&mockDatabase{})
}
