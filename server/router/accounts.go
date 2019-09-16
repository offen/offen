package router

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/offen/offen/server/persistence"
)

func (rt *router) getAccount(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	accountID := vars["accountID"]

	authCookie, authCookieErr := r.Cookie(authKey)
	if authCookieErr != nil {
		respondWithJSONError(w, errors.New("missing authentication token"), http.StatusForbidden)
		return
	}

	var userID string
	if err := rt.cookieSigner.Decode(authKey, authCookie.Value, &userID); err != nil {
		authCookie, _ = rt.authCookie("")
		http.SetCookie(w, authCookie)
		respondWithJSONError(w, fmt.Errorf("error decoding cookie value: %v", err), http.StatusUnauthorized)
		return
	}

	user, userErr := rt.db.LookupUser(userID)
	if userErr != nil {
		authCookie, _ = rt.authCookie("")
		http.SetCookie(w, authCookie)
		respondWithJSONError(w, fmt.Errorf("user with id %s does not exist: %v", userID, userErr), http.StatusNotFound)
	}

	if ok := user.CanAccessAccount(accountID); !ok {
		respondWithJSONError(w, fmt.Errorf("user does not have permissions to access account %s", accountID), http.StatusNotFound)
		return
	}

	result, err := rt.db.GetAccount(accountID, true, r.URL.Query().Get("since"))
	if err != nil {
		if _, ok := err.(persistence.ErrUnknownAccount); ok {
			respondWithJSONError(w, fmt.Errorf("account %s not found", accountID), http.StatusNotFound)
			return
		}
		rt.logError(err, "error looking up account")
		respondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	b, err := json.Marshal(&result)
	if err != nil {
		respondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(b)
}

type accountPayload struct {
	AccountID string `json:"accountId"`
}
