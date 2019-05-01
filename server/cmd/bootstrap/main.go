package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence/relational"
)

func getKeypair() (string, string, error) {
	key, keyErr := rsa.GenerateKey(rand.Reader, 4096)
	if keyErr != nil {
		return "", "", keyErr
	}
	public := key.Public().(*rsa.PublicKey)
	publicPem := pem.EncodeToMemory(
		&pem.Block{
			Type:  "RSA PUBLIC KEY",
			Bytes: x509.MarshalPKCS1PublicKey(public),
		},
	)
	privatePem := pem.EncodeToMemory(
		&pem.Block{
			Type:  "RSA PRIVATE KEY",
			Bytes: x509.MarshalPKCS1PrivateKey(key),
		},
	)
	return string(publicPem), string(privatePem), nil
}

func main() {
	connectionString := os.Getenv("POSTGRES_CONNECTION_STRING")
	db, err := gorm.Open("postgres", connectionString)
	if err != nil {
		panic(err)
	}

	defer db.Close()
	tx := db.Debug().Begin()

	if err := tx.DropTableIfExists("events", "accounts", "users").Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	if err := tx.AutoMigrate(&relational.Event{}, &relational.Account{}, &relational.User{}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	publicKey, privateKey, keyErr := getKeypair()
	if keyErr != nil {
		tx.Rollback()
		panic(keyErr)
	}
	account := relational.Account{
		AccountID:          "9b63c4d8-65c0-438c-9d30-cc4b01173393",
		PublicKey:          publicKey,
		EncryptedSecretKey: privateKey,
		UserSalt:           "78403940-ae4f-4aff-a395-1e90f145cf62",
	}
	if err := tx.Create(&account).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	publicKey, privateKey, keyErr = getKeypair()
	if keyErr != nil {
		tx.Rollback()
		panic(keyErr)
	}
	otherAccount := relational.Account{
		AccountID:          "78403940-ae4f-4aff-a395-1e90f145cf62",
		PublicKey:          publicKey,
		EncryptedSecretKey: privateKey,
		UserSalt:           "9b63c4d8-65c0-438c-9d30-cc4b01173393",
	}
	if err := tx.Create(&otherAccount).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	tx.Commit()

	fmt.Println("Successfully bootstrapped database for development.")
}
