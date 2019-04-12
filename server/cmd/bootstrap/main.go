package main

import (
	"crypto/sha256"
	"fmt"
	"os"

	"github.com/offen/offen/server/persistence/postgres"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
)

func main() {
	db, err := gorm.Open("postgres", os.Getenv("POSTGRES_CONNECTION_STRING"))
	if err != nil {
		panic(err)
	}

	defer db.Close()
	tx := db.Debug().Begin()

	if err := tx.DropTableIfExists("events", "users", "accounts").Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	if err := tx.AutoMigrate(&postgres.Event{}, &postgres.User{}, &postgres.Account{}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	if err := tx.Create(&postgres.Account{
		AccountID:          "9b63c4d8-65c0-438c-9d30-cc4b01173393",
		PublicKey:          "public-key",
		EncryptedSecretKey: "encrypted-secret-key",
		UserSalt:           "78403940-ae4f-4aff-a395-1e90f145cf62",
	}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	hashedUserID := sha256.Sum256([]byte(fmt.Sprintf("%s-%s", "78403940-ae4f-4aff-a395-1e90f145cf62", "user-id")))

	if err := tx.Create(&postgres.User{
		HashedUserID:        fmt.Sprintf("%x", hashedUserID),
		EncryptedUserSecret: "encrypted-user-secret",
	}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	tx.Commit()

	fmt.Println("Successfully bootstrapped database for development.")
}
