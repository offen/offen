package relational

import (
	"errors"
	"fmt"

	"github.com/offen/offen/server/persistence"
)

type transaction struct {
	*relationalDAL
}

func (t *transaction) Rollback() error {
	if err := t.db.Rollback().Error; err != nil {
		return fmt.Errorf("persistence: error rolling back transaction: %w", err)
	}
	return nil
}

func (t *transaction) Commit() error {
	if err := t.db.Commit().Error; err != nil {
		return fmt.Errorf("persistence: error committing transaction: %w", err)
	}
	return nil
}

func (t *transaction) Transaction() (persistence.Transaction, error) {
	return nil, errors.New("persistence: cannot call transaction on a transaction")
}

func (t *transaction) Ping() error {
	return errors.New("persistence: cannot call ping on a transaction")
}

func (t *transaction) ApplyMigrations() error {
	return errors.New("persistence: cannot apply migrations on a transaction")
}
