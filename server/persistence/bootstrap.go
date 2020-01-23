package persistence

import (
	"fmt"
	"time"

	uuid "github.com/gofrs/uuid"
	"github.com/offen/offen/server/keys"
)

// BootstrapConfig contains data about accounts and account users that is used
// to seed an application database from scratch.
type BootstrapConfig struct {
	Accounts     []BootstrapAccount     `yaml:"accounts"`
	AccountUsers []BootstrapAccountUser `yaml:"account_users"`
}

// BootstrapAccount contains the information needed for creating an account at
// bootstrap time.
type BootstrapAccount struct {
	ID   string `yaml:"id"`
	Name string `yaml:"name"`
}

// BootstrapAccountUser contains the information needed for creating an account
// user at bootstrap time.
type BootstrapAccountUser struct {
	Email    string   `yaml:"email"`
	Password string   `yaml:"password"`
	Accounts []string `yaml:"accounts"`
}

type accountCreation struct {
	encryptionKey []byte
	account       Account
}

// Bootstrap seeds a blank database with the given account and user
// data. This is likely only ever used in development.
func (p *persistenceLayer) Bootstrap(config BootstrapConfig, emailSalt []byte) error {
	txn, err := p.dal.Transaction()
	if err != nil {
		return fmt.Errorf("persistence: error creating transaction: %w", err)
	}
	if err := txn.DropAll(); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error dropping tables before inserting seed data: %w", err)
	}

	if err := txn.ApplyMigrations(); err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error applying initial migrations: %w", err)
	}

	accounts, accountUsers, relationships, err := bootstrapAccounts(&config, emailSalt)
	if err != nil {
		txn.Rollback()
		return fmt.Errorf("persistence: error creating seed data: %w", err)
	}
	for _, account := range accounts {
		if err := txn.CreateAccount(&account); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error creating account: %w", err)
		}
	}
	for _, accountUser := range accountUsers {
		if err := txn.CreateAccountUser(&accountUser); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error creating account user: %w", err)
		}
	}
	for _, relationship := range relationships {
		if err := txn.CreateAccountUserRelationship(&relationship); err != nil {
			txn.Rollback()
			return fmt.Errorf("persistence: error creating account user relationship: %w", err)
		}
	}
	if err := txn.Commit(); err != nil {
		return fmt.Errorf("persistence: error committing seed data: %w", err)
	}
	return nil
}

func bootstrapAccounts(config *BootstrapConfig, emailSalt []byte) ([]Account, []AccountUser, []AccountUserRelationship, error) {
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
		encryptedPrivateKey, encryptedPrivateKeyErr := keys.EncryptWith(encryptionKey, privateKey)
		if encryptedPrivateKeyErr != nil {
			return nil, nil, nil, encryptedPrivateKeyErr
		}

		salt, saltErr := keys.GenerateRandomValue(keys.DefaultSecretLength)
		if saltErr != nil {
			return nil, nil, nil, saltErr
		}

		record := Account{
			AccountID:           account.ID,
			Name:                account.Name,
			PublicKey:           string(publicKey),
			EncryptedPrivateKey: encryptedPrivateKey.Marshal(),
			UserSalt:            salt,
			Retired:             false,
			Created:             time.Now(),
		}
		accountCreations = append(accountCreations, accountCreation{
			account:       record,
			encryptionKey: encryptionKey,
		})
	}

	accountUserCreations := []AccountUser{}
	relationshipCreations := []AccountUserRelationship{}

	for _, accountUser := range config.AccountUsers {
		userID, idErr := uuid.NewV4()
		if idErr != nil {
			return nil, nil, nil, idErr
		}
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
			AccountUserID:  userID.String(),
			Salt:           salt,
			HashedPassword: hashedPw.Marshal(),
			HashedEmail:    hashedEmail,
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

			passwordDerivedKey, passwordDerivedKeyErr := keys.DeriveKey(accountUser.Password, salt)
			if passwordDerivedKeyErr != nil {
				return nil, nil, nil, passwordDerivedKeyErr
			}
			encryptedPasswordDerivedKey, encryptionErr := keys.EncryptWith(passwordDerivedKey, encryptionKey)
			if encryptionErr != nil {
				return nil, nil, nil, encryptionErr
			}

			emailDerivedKey, emailDerivedKeyErr := keys.DeriveKey(accountUser.Email, salt)
			if emailDerivedKeyErr != nil {
				return nil, nil, nil, emailDerivedKeyErr
			}
			encryptedEmailDerivedKey, encryptionErr := keys.EncryptWith(emailDerivedKey, encryptionKey)
			if encryptionErr != nil {
				return nil, nil, nil, encryptionErr
			}

			relationshipID, idErr := uuid.NewV4()
			if idErr != nil {
				return nil, nil, nil, idErr
			}
			r := AccountUserRelationship{
				RelationshipID:                    relationshipID.String(),
				AccountUserID:                     userID.String(),
				AccountID:                         accountID,
				PasswordEncryptedKeyEncryptionKey: encryptedPasswordDerivedKey.Marshal(),
				EmailEncryptedKeyEncryptionKey:    encryptedEmailDerivedKey.Marshal(),
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
