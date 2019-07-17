package router

import (
	"errors"
	"net/http"
)

func getAuthorizer(r *http.Request, claims map[string]interface{}) error {
	accountID := r.URL.Query().Get("accountId")
	if accountID == "" {
		return nil
	}
	accounts, ok := claims["accounts"].([]interface{})
	if !ok {
		return errors.New("no or malformed accounts claim")
	}
	for _, id := range accounts {
		if id == accountID {
			return nil
		}
	}
	return errors.New("no claim present for requested account")
}

func postAuthorizer(r *http.Request, claims map[string]interface{}) error {
	if claims == nil {
		return errors.New("received nil claims, cannot check")
	}
	if claims["rpc"] != "1" {
		return errors.New("bad rpc claim")
	}
	return nil
}
