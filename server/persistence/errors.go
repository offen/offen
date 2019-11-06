package persistence

import "errors"

// ErrUnknownAccount will be returned when an insert call tries to create an
// event for an account ID that does not exist in the database
type ErrUnknownAccount string

func (e ErrUnknownAccount) Error() string {
	return string(e)
}

// ErrUnknownUser will be returned when a given UserID (most likely in its hashed
// form) is not found in the database
type ErrUnknownUser string

func (e ErrUnknownUser) Error() string {
	return string(e)
}

// ErrBadQuery is returned when a DAL method cannot handle the given query
var ErrBadQuery = errors.New("dal: could not match query")
