package router

import (
	"net/http"
	"time"
)

func newCookie(userID string, secure bool) *http.Cookie {
	return &http.Cookie{
		Name:     cookieKey,
		Value:    userID,
		Expires:  time.Now().Add(time.Hour * 24 * 365),
		HttpOnly: true,
		Secure:   secure,
	}
}
