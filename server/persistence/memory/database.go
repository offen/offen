package memory

import (
	"github.com/offen/offen/server/persistence"
)

type inMemoryDatabase struct{}

func (i *inMemoryDatabase) Insert(accountID, userID, payload string) error {
	return nil
}

func (i *inMemoryDatabase) Query() ([]interface{}, error) {
	return []interface{}{}, nil
}

// New creates a new in-memory persistence layer that can be used
// in development.
func New() persistence.Database {
	return &inMemoryDatabase{}
}
