package relational

import (
	"fmt"
	"time"

	"github.com/jinzhu/gorm"
)

func Expire(db *gorm.DB, retention time.Duration) (int, error) {
	limit := time.Now().Add(-retention)
	deadline, deadlineErr := EventIDAt(limit)
	if deadlineErr != nil {
		return 0, fmt.Errorf("error determing deadline for purging events: %v", deadlineErr)
	}

	txn := db.Begin()
	result := txn.Table("events").Where("event_id < ?", deadline).Delete(&Event{})
	if result.Error != nil {
		txn.Rollback()
		return 0, fmt.Errorf("error deleting events: %v", result.Error)
	}

	fmt.Printf("About to purge %d expired events from before %v\n", result.RowsAffected, limit.Format(time.RFC1123Z))
	return int(result.RowsAffected), txn.Commit().Error
}
