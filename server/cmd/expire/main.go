package main

import (
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence/relational"
)

func main() {
	lambda.Start(handleExpire)
}

func handleExpire() error {
	db, dbErr := gorm.Open("postgres", os.Getenv("POSTGRES_CONNECTION_STRING"))
	if dbErr != nil {
		return fmt.Errorf("error establishing database connection: %v", dbErr)
	}

	retention, retentionErr := time.ParseDuration(os.Getenv("EVENT_RETENTION_PERIOD"))
	if retentionErr != nil {
		return retentionErr
	}

	limit := time.Now().Add(-retention)
	deadline, deadlineErr := relational.EventIDAt(limit)
	if deadlineErr != nil {
		return fmt.Errorf("error determing deadline for purging events: %v", deadlineErr)
	}

	txn := db.Begin()
	result := txn.Table("events").Where("event_id < ?", deadline).Delete(&relational.Event{})
	if result.Error != nil {
		txn.Rollback()
		return fmt.Errorf("error deleting events: %v", result.Error)
	}

	fmt.Printf("About to purge %d expired events from before %v\n", result.RowsAffected, limit.Format(time.RFC1123Z))
	return txn.Commit().Error
}
