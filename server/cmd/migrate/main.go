package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence/relational"
	gormigrate "gopkg.in/gormigrate.v1"
)

func main() {
	var (
		connection = flag.String("conn", os.Getenv("POSTGRES_CONNECTION_STRING"), "a postgres connection string")
	)
	flag.Parse()

	db, err := gorm.Open("postgres", *connection)
	if err != nil {
		log.Fatal(err)
	}

	db.LogMode(true)
	m := gormigrate.New(db, gormigrate.DefaultOptions, []*gormigrate.Migration{
		{
			// An Account entity stores an encrypted version of an RSA keypair.
			// Against common naming conventions, this was initially called
			// `EncryptedSecretKey`. This migration renames the column to
			// `EncryptedPrivateKey` so it aligns with naming throughout the
			// entire application.
			ID: "2019-08-02-rename-account-keys",
			Migrate: func(txn *gorm.DB) error {
				type Account struct {
					AccountID           string `gorm:"primary_key"`
					Name                string
					PublicKey           string
					EncryptedPrivateKey string
					// The deprecated column will be dropped manually later
					EncryptedSecretKey string
					UserSalt           string
					Events             []relational.Event `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
				}
				txn.AutoMigrate(&Account{})
				// Right now, an empty column with the correct name exists alongside
				// the previous one, so values are copied over verbatim for
				// each record.
				var accounts []Account
				if err := txn.Find(&accounts).Error; err != nil {
					return err
				}
				for _, account := range accounts {
					account.EncryptedPrivateKey = account.EncryptedSecretKey
					if err := txn.Save(&account).Error; err != nil {
						return err
					}
				}
				return txn.Model(&Account{}).DropColumn("encrypted_secret_key").Error
			},
			Rollback: func(txn *gorm.DB) error {
				// the rollback is basically the exact same thing as the migration
				// but copying is happening in the other direction
				type Account struct {
					AccountID           string `gorm:"primary_key"`
					Name                string
					PublicKey           string
					EncryptedPrivateKey string
					EncryptedSecretKey  string
					UserSalt            string
					Events              []relational.Event `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
				}
				txn.AutoMigrate(&Account{})
				var accounts []Account
				if err := txn.Find(&accounts).Error; err != nil {
					return err
				}
				for _, account := range accounts {
					account.EncryptedSecretKey = account.EncryptedPrivateKey
					if err := txn.Save(&account).Error; err != nil {
						return err
					}
				}
				return txn.Model(&Account{}).DropColumn("encrypted_private_key").Error
			},
		},
		{
			ID: "2019-08-03-retired-accounts",
			Migrate: func(txn *gorm.DB) error {
				type Account struct {
					Retired bool
				}
				txn.AutoMigrate(&Account{})
				txn.Model(&Account{}).Update("retired", false)
				return txn.Model(&Account{}).DropColumn("name").Error
			},
			Rollback: func(txn *gorm.DB) error {
				type Account struct {
					Name string
				}
				txn.AutoMigrate(&Account{})
				txn.Model(&Account{}).Update("name", "not set")
				return txn.Model(&Account{}).DropColumn("retired").Error
			},
		},
	})

	m.InitSchema(func(tx *gorm.DB) error {
		return tx.AutoMigrate(&relational.Event{}, &relational.Account{}, &relational.User{}).Error
	})

	if err := m.Migrate(); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Successfully ran database migrations.")
}
