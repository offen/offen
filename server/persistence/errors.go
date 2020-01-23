package persistence

import "errors"

// ErrUnknownAccount will be returned when an insert call tries to create an
// event for an account ID that does not exist in the database
type ErrUnknownAccount string

func (e ErrUnknownAccount) Error() string {
	return string(e)
}

// ErrUnknownSecret will be returned when a given SecretID
// is not found in the database
type ErrUnknownSecret string

func (e ErrUnknownSecret) Error() string {
	return string(e)
}

// ErrBadQuery is returned when a DAL method cannot handle the given query
var ErrBadQuery = errors.New("persistence: could not match query")
