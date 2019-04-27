package relational

import (
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"

	"github.com/mendsley/gojwk"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/persistence"
)

type relationalDatabase struct {
	db *gorm.DB
}

func (r *relationalDatabase) Insert(userID, accountID, payload string) error {
	eventID, err := persistence.NewEventID()
	if err != nil {
		return err
	}

	var account Account
	r.db.Where(`account_id = ?`, accountID).First(&account)

	if account.AccountID == "" {
		return persistence.ErrUnknownAccount(
			fmt.Sprintf("unknown account with id %s", accountID),
		)
	}

	hashedUserID := account.HashUserID(userID)

	r.db.Create(&Event{
		AccountID:    accountID,
		HashedUserID: hashedUserID,
		Payload:      payload,
		EventID:      eventID,
	})
	return nil
}

func (r *relationalDatabase) Query(query persistence.Query) ([]persistence.EventResult, error) {
	var accounts []Account
	if len(query.AccountIDs()) == 0 {
		if err := r.db.Find(&accounts).Error; err != nil {
			return nil, err
		}
	} else {
		if err := r.db.Find(&accounts, "account_id in (?)", query.AccountIDs()).Error; err != nil {
			return nil, err
		}
	}

	if len(accounts) == 0 {
		return []persistence.EventResult{}, nil
	}

	userID := query.UserID()
	hashes := make(chan string)

	// in case a user queries for a longer list of account ids (or even all of them)
	// hashing the user ID against all salts can get relatively expensive, so
	// computation is being done concurrently
	for _, account := range accounts {
		go func(account Account) {
			hash := account.HashUserID(userID)
			hashes <- hash
		}(account)
	}

	var hashedUserIDs []string
	for result := range hashes {
		hashedUserIDs = append(hashedUserIDs, result)
		if len(hashedUserIDs) == len(accounts) {
			close(hashes)
			break
		}
	}

	var eventConditions []interface{}
	var result []Event
	if query.Since() != "" {
		eventConditions = []interface{}{
			"event_id > ? AND hashed_user_id in (?)",
			query.Since(),
			hashedUserIDs,
		}
	} else {
		eventConditions = []interface{}{"hashed_user_id in (?)", hashedUserIDs}
	}

	if err := r.db.Find(&result, eventConditions...).Error; err != nil {
		return nil, err
	}

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

func (r *relationalDatabase) GetAccount(accountID string) (persistence.AccountResult, error) {
	var account Account
	if err := r.db.Find(&account, "account_id = ?", accountID).Error; err != nil {
		if gorm.IsRecordNotFoundError(err) {
			return persistence.AccountResult{}, persistence.ErrUnknownAccount(fmt.Sprintf("account id %s unknown", accountID))
		}
		return persistence.AccountResult{}, err
	}

	decoded, _ := pem.Decode([]byte(account.PublicKey))

	pub, pubErr := x509.ParsePKCS1PublicKey(decoded.Bytes)
	if pubErr != nil {
		return persistence.AccountResult{}, pubErr
	}

	key, keyErr := gojwk.PublicKey(pub)
	if keyErr != nil {
		return persistence.AccountResult{}, keyErr
	}

	return persistence.AccountResult{
		AccountID: account.AccountID,
		PublicKey: *key,
	}, nil
}

func (r *relationalDatabase) AssociateUserSecret(accountID, userID, encryptedUserSecret string) error {
	var account Account
	if err := r.db.Find(&account, "account_id = ?", accountID).Error; err != nil {
		return err
	}
	hashedUserID := account.HashUserID(userID)

	var user User
	// there is an issue with the postgres backend of GORM that disallows inserting
	// primary keys when using `FirstOrCreate`, so we need to do a manual check
	// for existence beforehand
	if err := r.db.First(&user, "hashed_user_id = ?", hashedUserID).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			return err
		}
		if err := r.db.FirstOrCreate(&user, User{
			EncryptedUserSecret: encryptedUserSecret,
			HashedUserID:        hashedUserID,
		}).Error; err != nil {
			return err
		}
	}
	return nil
}

// New creates a persistence layer that connects to a PostgreSQL database
func New(configs ...Config) (persistence.Database, error) {
	opts := dbOptions{
		dialect:          "postgres",
		connectionString: os.Getenv("POSTGRES_CONNECTION_STRING"),
	}
	for _, config := range configs {
		var err error
		opts, err = config(opts)
		if err != nil {
			return nil, err
		}
	}

	db, err := gorm.Open(opts.dialect, opts.connectionString)
	if err != nil {
		return nil, err
	}

	return &relationalDatabase{db}, nil
}
