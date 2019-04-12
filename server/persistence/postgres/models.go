package postgres

type Event struct {
	EventID      string `gorm:"primary_key"`
	AccountID    string
	HashedUserID string
	Payload      string
	Account      Account `gorm:"foreignkey:AccountID;association_foreignkey:AccountID"`
	User         User    `gorm:"foreignkey:HashedUserID;association_foreignkey:HashedUserID"`
}

type User struct {
	HashedUserID        string `gorm:"primary_key"`
	EncryptedUserSecret string
}

type Account struct {
	AccountID          string `gorm:"primary_key"`
	PublicKey          string
	EncryptedSecretKey string
	UserSalt           string
}
