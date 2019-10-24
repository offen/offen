//+build integration

package relational

import (
	"os"
	"testing"

	"github.com/jinzhu/gorm"
	// GORM imports the dialects for side effects only
	_ "github.com/jinzhu/gorm/dialects/postgres"
)

func TestNew(t *testing.T) {
	t.Run("default", func(t *testing.T) {
		db, err := gorm.Open("postgres", os.Getenv("CONNECTION_STRING"))
		_, err = New(db)
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
	})
}
