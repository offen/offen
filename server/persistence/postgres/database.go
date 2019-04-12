package postgres

import (
	"crypto/sha256"
	"fmt"
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

	var account Account
	p.db.Find(&account, "account_id = ?", accountID)

	hashedUserID := sha256.Sum256([]byte(fmt.Sprintf("%s-%s", account.UserSalt, userID)))

	p.db.Create(&Event{
		AccountID:    accountID,
		HashedUserID: fmt.Sprintf("%x", hashedUserID),
		Payload:      payload,
		EventID:      eventID.String(),
	})
	return nil
}

func (p *postgresDatabase) Query(query persistence.Query) ([]persistence.EventResult, error) {
	var accounts []Account
	if query.AccountID() == "" {
		p.db.Find(&accounts)
	} else {
		p.db.Find(&accounts, "account_id = ?", query.AccountID())
	}

	hashedUserIDs := []string{}
	for _, account := range accounts {
		hashed := sha256.Sum256([]byte(fmt.Sprintf("%s-%s", account.UserSalt, query.UserID())))
		hashedUserIDs = append(hashedUserIDs, fmt.Sprintf("%x", hashed))
	}

	var where []interface{}
	if query.Since() != "" {
		where = []interface{}{"event_id > ? AND hashed_user_id in (?)", query.Since(), hashedUserIDs}
	} else {
		where = []interface{}{"hashed_user_id in (?)", query.Since(), hashedUserIDs}
	}

	result := []Event{}
	p.db.Find(&result, where...)

	out := []persistence.EventResult{}
	for _, match := range result {
		out = append(out, persistence.EventResult{
			AccountID: match.AccountID,
			UserID:    match.HashedUserID,
			Payload:   match.Payload,
			EventID:   match.EventID,
		})
	}
	return out, nil
}

// New creates a persistence layer that connects to a PostgreSQL database
func New() (persistence.Database, error) {
	db, err := gorm.Open("postgres", os.Getenv("POSTGRES_CONNECTION_STRING"))
	if err != nil {
		return nil, err
	}

	return &postgresDatabase{db}, nil
}
