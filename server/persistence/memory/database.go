package memory

import (
	"math/rand"
	"sync"
	"time"

	"github.com/offen/offen/server/persistence"
	"github.com/oklog/ulid"
)

type inMemoryDatabase struct {
	sync.Mutex
	rows []row
}

func (i *inMemoryDatabase) Insert(userID, accountID, payload string) error {
	t := time.Now()
	eventID, err := ulid.New(
		ulid.Timestamp(t),
		ulid.Monotonic(rand.New(rand.NewSource(t.UnixNano())), 0),
	)
	if err != nil {
		return err
	}
	insert := row{
		accountID: accountID,
		userID:    userID,
		eventID:   eventID.String(),
		payload:   payload,
	}
	i.Lock()
	defer i.Unlock()
	i.rows = append(i.rows, insert)
	return nil
}

type row struct {
	accountID string
	userID    string
	eventID   string
	payload   string
}

func (i *inMemoryDatabase) Query(query persistence.Query) ([]persistence.EventResult, error) {
	result := []persistence.EventResult{}
	for _, item := range i.rows {
		if query.AccountID() != "" && query.AccountID() != item.accountID {
			break
		}
		if query.UserID() != "" && query.UserID() != item.userID {
			break
		}
		if query.Since() != "" && query.Since() >= item.eventID {
			break
		}
		result = append(result, persistence.EventResult{
			AccountID: item.accountID,
			EventID:   item.eventID,
			UserID:    item.userID,
			Payload:   item.payload,
		})
	}
	return result, nil
}

// New creates a new in-memory persistence layer that can be used
// in development.
func New() persistence.Database {
	return &inMemoryDatabase{}
}
