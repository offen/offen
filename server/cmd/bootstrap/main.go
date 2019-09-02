package main

import (
	"encoding/base64"
	"flag"
	"fmt"
	"io/ioutil"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/keys"
	"github.com/offen/offen/server/persistence/relational"
	uuid "github.com/satori/go.uuid"
	yaml "gopkg.in/yaml.v2"
)

type bootstrapConfig struct {
	Accounts     []accountConfig `yaml:"accounts"`
	AccountUsers []accountUser   `yaml:"account_users"`
}

type accountConfig struct {
	ID   string `yaml:"id"`
	Name string `yaml:"name"`
}

type accountUser struct {
	Email    string   `yaml:"email"`
	Password string   `yaml:"password"`
	Accounts []string `yaml:"accounts"`
}

type accountCreation struct {
	encryptionKey []byte
	account       relational.Account
}

func main() {
	var (
		source     = flag.String("source", "bootstrap.yml", "the configuration file")
		connection = flag.String("conn", os.Getenv("POSTGRES_CONNECTION_STRING"), "a postgres connection string")
		emailSalt  = flag.String("salt", os.Getenv("ACCOUNT_USER_EMAIL_SALT"), "the salt value used when hashing account user emails")
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

	if err := tx.Delete(&relational.Event{}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}
	if err := tx.Delete(&relational.Account{}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}
	if err := tx.Delete(&relational.User{}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}
	if err := tx.Delete(&relational.AccountUser{}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}
	if err := tx.Delete(&relational.AccountUserRelationship{}).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	accountCreations := []accountCreation{}
	for _, account := range config.Accounts {
		publicKey, privateKey, keyErr := keys.GenerateRSAKeypair(keys.RSAKeyLength)
		if keyErr != nil {
			tx.Rollback()
			panic(keyErr)
		}

		encryptionKey, encryptionKeyErr := keys.GenerateEncryptionKey(keys.DefaultEncryptionKeySize)
		if encryptionKeyErr != nil {
			tx.Rollback()
			panic(encryptionKeyErr)
		}
		encryptedPrivateKey, privateKeyNonce, encryptedPrivateKeyErr := keys.EncryptWith(encryptionKey, privateKey)
		if encryptedPrivateKeyErr != nil {
			tx.Rollback()
			panic(encryptedPrivateKeyErr)
		}

		salt, saltErr := keys.GenerateRandomString(keys.UserSaltLength)
		if saltErr != nil {
			tx.Rollback()
			panic(saltErr)
		}

		account := relational.Account{
			AccountID: account.ID,
			PublicKey: string(publicKey),
			EncryptedPrivateKey: fmt.Sprintf(
				"%s %s",
				base64.StdEncoding.EncodeToString(privateKeyNonce),
				base64.StdEncoding.EncodeToString(encryptedPrivateKey),
			),
			UserSalt: salt,
			Retired:  false,
		}
		accountCreations = append(accountCreations, accountCreation{
			account:       account,
			encryptionKey: encryptionKey,
		})
	}

	accountUserCreations := []relational.AccountUser{}
	relationshipCreations := []relational.AccountUserRelationship{}

	for _, accountUser := range config.AccountUsers {
		userID := uuid.NewV4()
		hashedPw, hashedPwErr := keys.HashPassword(accountUser.Password)
		if hashedPwErr != nil {
			tx.Rollback()
			panic(hashedPwErr)
		}
		hashedEmail, hashedEmailErr := keys.HashEmail(accountUser.Email, *emailSalt)
		if hashedEmailErr != nil {
			tx.Rollback()
			panic(hashedEmailErr)
		}
		salt, saltErr := keys.GenerateRandomString(8)
		if saltErr != nil {
			tx.Rollback()
			panic(saltErr)
		}
		user := relational.AccountUser{
			UserID:         userID.String(),
			HashedPassword: string(hashedPw),
			Salt:           salt,
			HashedEmail:    base64.StdEncoding.EncodeToString(hashedEmail),
		}
		accountUserCreations = append(accountUserCreations, user)

		for _, accountID := range accountUser.Accounts {
			var encryptionKey []byte
			for _, creation := range accountCreations {
				if creation.account.AccountID == accountID {
					encryptionKey = creation.encryptionKey
					break
				}
			}
			if encryptionKey == nil {
				tx.Rollback()
				panic(fmt.Errorf("account with id %s not found", accountID))
			}

			passwordDerivedKey, passwordDerivedKeyErr := keys.DeriveKey(accountUser.Password, []byte(salt))
			if passwordDerivedKeyErr != nil {
				tx.Rollback()
				panic(passwordDerivedKeyErr)
			}
			encryptedPasswordDerivedKey, passwordEncryptionNonce, encryptionErr := keys.EncryptWith(passwordDerivedKey, encryptionKey)
			if encryptionErr != nil {
				tx.Rollback()
				panic(encryptionErr)
			}

			emailDerivedKey, emailDerivedKeyErr := keys.DeriveKey(accountUser.Email, []byte(salt))
			if emailDerivedKeyErr != nil {
				tx.Rollback()
				panic(emailDerivedKeyErr)
			}
			encryptedEmailDerivedKey, emailEncryptionNonce, encryptionErr := keys.EncryptWith(emailDerivedKey, encryptionKey)
			if encryptionErr != nil {
				tx.Rollback()
				panic(encryptionErr)
			}

			relationshipID := uuid.NewV4()
			r := relational.AccountUserRelationship{
				RelationshipID: relationshipID.String(),
				UserID:         userID.String(),
				AccountID:      accountID,
				PasswordEncryptedKeyEncryptionKey: fmt.Sprintf(
					"%s %s",
					base64.StdEncoding.EncodeToString(passwordEncryptionNonce),
					base64.StdEncoding.EncodeToString(encryptedPasswordDerivedKey),
				),
				EmailEncryptedKeyEncryptionKey: fmt.Sprintf(
					"%s %s",
					base64.StdEncoding.EncodeToString(emailEncryptionNonce),
					base64.StdEncoding.EncodeToString(encryptedEmailDerivedKey),
				),
			}
			relationshipCreations = append(relationshipCreations, r)
		}
	}

	for _, account := range accountCreations {
		tx.Create(&account.account)
	}
	for _, accountUser := range accountUserCreations {
		tx.Create(&accountUser)
	}
	for _, relationship := range relationshipCreations {
		tx.Create(&relationship)
	}
	tx.Commit()
	fmt.Println("Successfully bootstrapped database for development.")
}
