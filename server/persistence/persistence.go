package persistence

// Database is anything that can be used to store and query event data
type Database interface {
	Insert(userID, accountID, payload string) error
	Query() ([]interface{}, error)
}
