package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/keys/local"
	"github.com/offen/offen/server/persistence/relational"
	yaml "gopkg.in/yaml.v2"
)

type accountConfig struct {
	Name string `yaml:"name"`
	ID   string `yaml:"id"`
}

func main() {
	var (
		source             = flag.String("source", "bootstrap.yml", "the configuration file")
		connection         = flag.String("conn", os.Getenv("POSTGRES_CONNECTION_STRING"), "a postgres connection string")
		encryptionEndpoint = flag.String("kms", os.Getenv("KMS_ENCRYPTION_ENDPOINT"), "the endpoint used for encrypting private keys")
	)
	flag.Parse()

	read, readErr := ioutil.ReadFile(*source)
	if readErr != nil {
		panic(readErr)
	}

	var accounts []accountConfig
	if err := yaml.Unmarshal(read, &accounts); err != nil {
		panic(err)
	}

	db, err := gorm.Open("postgres", *connection)
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

	keyOps := local.New(*encryptionEndpoint)

	for _, account := range accounts {
		publicKey, privateKey, keyErr := keyOps.GenerateRSAKeypair(keys.RSAKeyLength)
		if keyErr != nil {
			tx.Rollback()
			panic(keyErr)
		}
		encryptedKey, encryptedErr := keyOps.RemoteEncrypt(privateKey)
		if encryptedErr != nil {
			tx.Rollback()
			panic(keyErr)
		}
		salt, saltErr := keyOps.GenerateRandomString(keys.UserSaltLength)
		if saltErr != nil {
			tx.Rollback()
			panic(saltErr)
		}
		account := relational.Account{
			AccountID:          account.ID,
			PublicKey:          string(publicKey),
			EncryptedSecretKey: string(encryptedKey),
			UserSalt:           salt,
			Name:               account.Name,
		}
		if err := tx.Create(&account).Error; err != nil {
			tx.Rollback()
			panic(err)
		}
	}

	tx.Commit()
	fmt.Println("Successfully bootstrapped database for development.")
}
