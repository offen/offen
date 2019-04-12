package postgres

import (
	"math/rand"
	"os"
	"time"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence"
	"github.com/oklog/ulid"
)

type postgresDatabase struct {
	db *gorm.DB
}

func (p *postgresDatabase) Insert(userID, accountID, payload string) error {
	t := time.Now()
	eventID, err := ulid.New(
		ulid.Timestamp(t),
		ulid.Monotonic(rand.New(rand.NewSource(t.UnixNano())), 0),
	)
	if err != nil {
		return err
	}

	p.db.Create(&Event{
		AccountID: accountID,
		UserID:    userID,
		Payload:   payload,
		EventID:   eventID.String(),
	})
	return nil
}

func (p *postgresDatabase) Query(query persistence.Query) ([]persistence.EventResult, error) {
	where := []interface{}{}

	if query.AccountID() != "" {
		where = append(where, "account_id = ?", query.AccountID())
	}
	if query.UserID() != "" {
		where = append(where, "user_id = ?", query.UserID())
	}
	if query.Since() != "" {
		where = append(where, "event_id > ?", query.Since())
	}

	result := []Event{}
	p.db.Find(&result, where...)

	out := []persistence.EventResult{}
	for _, match := range result {
		out = append(out, persistence.EventResult{
			AccountID: match.AccountID,
			UserID:    match.UserID,
			Payload:   match.Payload,
			EventID:   match.EventID,
		})
	}
	return out, nil
}

type Event struct {
	AccountID string
	UserID    string
	EventID   string
	Payload   string
}

func New() (persistence.Database, error) {
	db, err := gorm.Open("postgres", os.Getenv("POSTGRES_CONNECTION_STRING"))
	if err != nil {
		return nil, err
	}

	db.AutoMigrate(&Event{})

	return &postgresDatabase{db}, nil
}
