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
	AccountID string `yaml:"id"`
	Name      string `yaml:"name"`
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
func (p *persistenceLayer) Bootstrap(config BootstrapConfig) error {
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

	accounts, accountUsers, relationships, err := bootstrapAccounts(&config)
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

func bootstrapAccounts(config *BootstrapConfig) ([]Account, []AccountUser, []AccountUserRelationship, error) {
	accountCreations := []accountCreation{}
	for _, account := range config.Accounts {
		record, encryptionKey, err := newAccount(account.Name, account.AccountID)
		if err != nil {
			return nil, nil, nil, fmt.Errorf("persistence: error creating new account %s: %w", account.Name, err)
		}
		accountCreations = append(accountCreations, accountCreation{
			account:       *record,
			encryptionKey: encryptionKey,
		})
	}

	accountUserCreations := []AccountUser{}
	relationshipCreations := []AccountUserRelationship{}

	for _, accountUserData := range config.AccountUsers {
		accountUser, err := newAccountUser(accountUserData.Email, accountUserData.Password)
		if err != nil {
			return nil, nil, nil, err
		}
		accountUserCreations = append(accountUserCreations, *accountUser)

		for _, accountID := range accountUserData.Accounts {
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

			r, err := newAccountUserRelationship(accountUser.AccountUserID, accountID)
			if err != nil {
				return nil, nil, nil, fmt.Errorf("persistence: error creating account user relationship: %w", err)
			}
			if err := r.addPasswordEncryptedKey(encryptionKey, accountUser.Salt, accountUserData.Password); err != nil {
				return nil, nil, nil, fmt.Errorf("persistence: error adding password encrypted key: %w", err)
			}
			if err := r.addEmailEncryptedKey(encryptionKey, accountUser.Salt, accountUserData.Email); err != nil {
				return nil, nil, nil, fmt.Errorf("persistence: error adding email encrypted key: %w", err)
			}

			relationshipCreations = append(relationshipCreations, *r)
		}
	}
	var accounts []Account
	for _, creation := range accountCreations {
		accounts = append(accounts, creation.account)
	}
	return accounts, accountUserCreations, relationshipCreations, nil
}

func newAccountUser(email, password string) (*AccountUser, error) {
	accountUserID, idErr := uuid.NewV4()
	if idErr != nil {
		return nil, idErr
	}
	hashedEmail, hashedEmailErr := keys.HashString(email)
	if hashedEmailErr != nil {
		return nil, hashedEmailErr
	}
	salt, saltErr := keys.GenerateRandomValue(keys.DefaultSaltLength)
	if saltErr != nil {
		return nil, saltErr
	}
	a := &AccountUser{
		AccountUserID: accountUserID.String(),
		Salt:          salt,
		HashedEmail:   hashedEmail.Marshal(),
	}

	if password != "" {
		hashedPw, hashedPwErr := keys.HashString(password)
		if hashedPwErr != nil {
			return nil, hashedPwErr
		}
		a.HashedPassword = hashedPw.Marshal()
	}

	return a, nil
}

func newAccount(name, accountID string) (*Account, []byte, error) {
	if accountID == "" {
		randomID, err := uuid.NewV4()
		if err != nil {
			return nil, nil, fmt.Errorf("persistence: error creating random account id: %w", err)
		}
		accountID = randomID.String()
	} else {
		_, err := uuid.FromString(accountID)
		if err != nil {
			return nil, nil, fmt.Errorf("persistence: received malformed account id, expected valid uuid: %w", err)
		}
	}

	publicKey, privateKey, keyErr := keys.GenerateRSAKeypair(keys.RSAKeyLength)
	if keyErr != nil {
		return nil, nil, keyErr
	}

	encryptionKey, encryptionKeyErr := keys.GenerateRandomBytes(keys.DefaultEncryptionKeySize)
	if encryptionKeyErr != nil {
		return nil, nil, encryptionKeyErr
	}
	encryptedPrivateKey, encryptedPrivateKeyErr := keys.EncryptWith(encryptionKey, privateKey)
	if encryptedPrivateKeyErr != nil {
		return nil, nil, encryptedPrivateKeyErr
	}

	salt, saltErr := keys.GenerateRandomValue(keys.DefaultSecretLength)
	if saltErr != nil {
		return nil, nil, saltErr
	}

	return &Account{
		AccountID:           accountID,
		Name:                name,
		PublicKey:           string(publicKey),
		EncryptedPrivateKey: encryptedPrivateKey.Marshal(),
		UserSalt:            salt,
		Retired:             false,
		Created:             time.Now(),
	}, encryptionKey, nil
}

func newAccountUserRelationship(accountUserID, accountID string) (*AccountUserRelationship, error) {
	randomID, err := uuid.NewV4()
	if err != nil {
		return nil, fmt.Errorf("persistence: error creating random id for relationship: %w", err)
	}
	return &AccountUserRelationship{
		RelationshipID: randomID.String(),
		AccountUserID:  accountUserID,
		AccountID:      accountID,
	}, nil
}
