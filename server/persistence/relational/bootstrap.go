package relational

import (
	"encoding/base64"
	"fmt"

	"github.com/jinzhu/gorm"
	"github.com/offen/offen/server/keys"
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
	account       Account
}

func Bootstrap(data []byte, db *gorm.DB, emailSalt []byte) error {
	var config bootstrapConfig
	if err := yaml.Unmarshal(data, &config); err != nil {
		return err
	}

	defer db.Close()
	tx := db.Debug().Begin()

	if err := tx.Delete(&Event{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Delete(&Account{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Delete(&User{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Delete(&AccountUser{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Delete(&AccountUserRelationship{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	accounts, accountUsers, relationships, err := bootstrapAccounts(&config, emailSalt)
	if err != nil {
		tx.Rollback()
		return err
	}
	for _, account := range accounts {
		if err := tx.Create(&account).Error; err != nil {
			tx.Rollback()
			return err
		}
	}
	for _, accountUser := range accountUsers {
		if err := tx.Create(&accountUser).Error; err != nil {
			tx.Rollback()
			return err
		}
	}
	for _, relationship := range relationships {
		if err := tx.Create(&relationship).Error; err != nil {
			tx.Rollback()
			return err
		}
	}
	tx.Commit()
	return nil
}

func bootstrapAccounts(config *bootstrapConfig, emailSalt []byte) ([]Account, []AccountUser, []AccountUserRelationship, error) {
	accountCreations := []accountCreation{}
	for _, account := range config.Accounts {
		publicKey, privateKey, keyErr := keys.GenerateRSAKeypair(keys.RSAKeyLength)
		if keyErr != nil {
			return nil, nil, nil, keyErr
		}

		encryptionKey, encryptionKeyErr := keys.GenerateEncryptionKey(keys.DefaultEncryptionKeySize)
		if encryptionKeyErr != nil {
			return nil, nil, nil, encryptionKeyErr
		}
		encryptedPrivateKey, privateKeyNonce, encryptedPrivateKeyErr := keys.EncryptWith(encryptionKey, privateKey)
		if encryptedPrivateKeyErr != nil {
			return nil, nil, nil, encryptedPrivateKeyErr
		}

		salt, saltErr := keys.GenerateRandomValue(keys.UserSaltLength)
		if saltErr != nil {
			return nil, nil, nil, saltErr
		}

		record := Account{
			AccountID: account.ID,
			Name:      account.Name,
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
			account:       record,
			encryptionKey: encryptionKey,
		})
	}

	accountUserCreations := []AccountUser{}
	relationshipCreations := []AccountUserRelationship{}

	for _, accountUser := range config.AccountUsers {
		userID := uuid.NewV4()
		hashedPw, hashedPwErr := keys.HashPassword(accountUser.Password)
		if hashedPwErr != nil {
			return nil, nil, nil, hashedPwErr
		}
		hashedEmail, hashedEmailErr := keys.HashEmail(accountUser.Email, emailSalt)
		if hashedEmailErr != nil {
			return nil, nil, nil, hashedEmailErr
		}
		salt, saltErr := keys.GenerateRandomValue(8)
		if saltErr != nil {
			return nil, nil, nil, saltErr
		}
		user := AccountUser{
			UserID:         userID.String(),
			HashedPassword: hashedPw,
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
				return nil, nil, nil, fmt.Errorf("account with id %s not found", accountID)
			}

			passwordDerivedKey, passwordDerivedKeyErr := keys.DeriveKey(accountUser.Password, []byte(salt))
			if passwordDerivedKeyErr != nil {
				return nil, nil, nil, passwordDerivedKeyErr
			}
			encryptedPasswordDerivedKey, passwordEncryptionNonce, encryptionErr := keys.EncryptWith(passwordDerivedKey, encryptionKey)
			if encryptionErr != nil {
				return nil, nil, nil, encryptionErr
			}

			emailDerivedKey, emailDerivedKeyErr := keys.DeriveKey(accountUser.Email, []byte(salt))
			if emailDerivedKeyErr != nil {
				return nil, nil, nil, emailDerivedKeyErr
			}
			encryptedEmailDerivedKey, emailEncryptionNonce, encryptionErr := keys.EncryptWith(emailDerivedKey, encryptionKey)
			if encryptionErr != nil {
				return nil, nil, nil, encryptionErr
			}

			relationshipID := uuid.NewV4()
			r := AccountUserRelationship{
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
	var accounts []Account
	for _, creation := range accountCreations {
		accounts = append(accounts, creation.account)
	}
	return accounts, accountUserCreations, relationshipCreations, nil
}
