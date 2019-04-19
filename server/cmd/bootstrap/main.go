package main

import (
	"fmt"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence/relational"
)

func main() {
	db, err := gorm.Open("postgres", "postgres://postgres:develop@database:5432/postgres?sslmode=disable")
	if err != nil {
		panic(err)
	}

	defer db.Close()
	tx := db.Debug().Begin()

	if err := tx.DropTableIfExists("events", "accounts").Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	if err := tx.AutoMigrate(&relational.Event{}, &relational.Account{}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	account := relational.Account{
		AccountID:          "9b63c4d8-65c0-438c-9d30-cc4b01173393",
		PublicKey:          "public-key",
		EncryptedSecretKey: "encrypted-secret-key",
		UserSalt:           "78403940-ae4f-4aff-a395-1e90f145cf62",
	}
	if err := tx.Create(&account).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	otherAccount := relational.Account{
		AccountID:          "78403940-ae4f-4aff-a395-1e90f145cf62",
		PublicKey:          "public-key",
		EncryptedSecretKey: "encrypted-secret-key",
		UserSalt:           "9b63c4d8-65c0-438c-9d30-cc4b01173393",
	}
	if err := tx.Create(&otherAccount).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	tx.Commit()

	fmt.Println("Successfully bootstrapped database for development.")
}
