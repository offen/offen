package persistence

// ErrUnknownAccount will be returned when an insert call tries to create an
// event for an account ID that does not exist in the database
type ErrUnknownAccount string

func (e ErrUnknownAccount) Error() string {
	return string(e)
}
