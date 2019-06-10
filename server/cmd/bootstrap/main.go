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
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"

	yaml "gopkg.in/yaml.v2"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence/relational"
)

func getRSAKeypair(encryptionEndpoint string) (string, string, error) {
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

	// this currently is used in CI where the private keys don't need
	// to be encrypted yet
	if encryptionEndpoint != "" {
		p := struct {
			Decrypted string `json:"decrypted"`
		}{
			Decrypted: string(privatePem),
		}
		payload, _ := json.Marshal(&p)
		res, err := http.Post(
			encryptionEndpoint,
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

	for _, account := range accounts {
		publicKey, privateKey, keyErr := getRSAKeypair(*encryptionEndpoint)
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
			AccountID:          account.ID,
			PublicKey:          publicKey,
			EncryptedSecretKey: privateKey,
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
