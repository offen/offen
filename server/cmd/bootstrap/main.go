package main

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence/relational"
)

func getRSAKeypair() (string, string, error) {
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

	secretKey := string(privatePem)
	if endpoint, ok := os.LookupEnv("KMS_ENCRYPTION_ENDPOINT"); ok {
		fmt.Printf("endpoint %s\n", endpoint)
		p := struct {
			Decrypted string `json:"decrypted"`
		}{
			Decrypted: string(privatePem),
		}
		payload, _ := json.Marshal(&p)
		res, err := http.Post(
			endpoint,
			"application/json",
			bytes.NewReader(payload),
		)
		if err != nil {
			return "", "", err
		}
		if res.StatusCode != http.StatusOK {
			body, _ := ioutil.ReadAll(res.Body)
			fmt.Printf("error encoding secret key: %v", string(body))
			return "", "", errors.New("error")
		}

		r := struct {
			Encrypted string `json:"encrypted"`
		}{}
		json.NewDecoder(res.Body).Decode(&r)
		secretKey = r.Encrypted
	}

	return string(publicPem), secretKey, nil
}

func createSalt(length int) (string, error) {
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	s := base64.URLEncoding.EncodeToString(b)
	return s[:length], nil
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

	publicKey, privateKey, keyErr := getRSAKeypair()
	if keyErr != nil {
		tx.Rollback()
		panic(keyErr)
	}
	salt, saltErr := createSalt(16)
	if saltErr != nil {
		tx.Rollback()
		panic(saltErr)
	}
	account := relational.Account{
		AccountID:          "9b63c4d8-65c0-438c-9d30-cc4b01173393",
		PublicKey:          publicKey,
		EncryptedSecretKey: privateKey,
		UserSalt:           salt,
	}
	if err := tx.Create(&account).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	publicKey, privateKey, keyErr = getRSAKeypair()
	if keyErr != nil {
		tx.Rollback()
		panic(keyErr)
	}

	salt2, salt2Err := createSalt(16)
	if salt2Err != nil {
		tx.Rollback()
		panic(salt2Err)
	}
	otherAccount := relational.Account{
		AccountID:          "78403940-ae4f-4aff-a395-1e90f145cf62",
		PublicKey:          publicKey,
		EncryptedSecretKey: privateKey,
		UserSalt:           salt2,
	}
	if err := tx.Create(&otherAccount).Error; err != nil {
		tx.Rollback()
		panic(err)
	}

	tx.Commit()

	fmt.Println("Successfully bootstrapped database for development.")
}
