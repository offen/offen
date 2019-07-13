package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/keys/remote"
	"github.com/offen/offen/server/persistence/relational"
	yaml "gopkg.in/yaml.v2"
)

type bootstrapConfig struct {
	Accounts []accountConfig `yaml:"accounts"`
}

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

	var config bootstrapConfig
	if err := yaml.Unmarshal(read, &config); err != nil {
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

	remoteEncryption := remote.New(*encryptionEndpoint)

	for _, account := range config.Accounts {
		publicKey, privateKey, keyErr := keys.GenerateRSAKeypair(keys.RSAKeyLength)
		if keyErr != nil {
			tx.Rollback()
			panic(keyErr)
		}

		encryptedKey, encryptedErr := remoteEncryption.Encrypt(privateKey)
		if encryptedErr != nil {
			if _, ok := os.LookupEnv("CI"); ok {
				encryptedKey = nil
			} else {
				tx.Rollback()
				panic(encryptedErr)
			}
		}

		salt, saltErr := keys.GenerateRandomString(keys.UserSaltLength)
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
