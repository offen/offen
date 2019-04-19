package persistence

// Database is anything that can be used to store and query event data
type Database interface {
	Insert(userID, accountID, payload string) error
	Query(Query) ([]EventResult, error)
}

// Query defines a set of filters to limit the set of results to be returned
// In case a field has the zero value, its filter will not be applied.
type Query interface {
	AccountIDs() []string
	UserID() string
	Since() string
}

// EventResult is an element returned from a query. It contains all data that
// is stored about an atomic event.
type EventResult struct {
	AccountID string `json:"account_id"`
	UserID    string `json:"user_id"`
	EventID   string `json:"event_id"`
	Payload   string `json:"payload"`
}

// ErrUnknownAccount will be returned when an insert call tries to create an
// event for an account ID that does not exist in the database
type ErrUnknownAccount string

func (e ErrUnknownAccount) Error() string {
	return string(e)
}
