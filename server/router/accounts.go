package router

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/offen/offen/server/persistence"
)

func (rt *router) getAccount(w http.ResponseWriter, r *http.Request) {
	accountID := r.URL.Query().Get("account_id")
	if accountID == "" {
		respondWithError(w, errors.New("no account_id parameter given"), http.StatusBadRequest)
		return
	}
	result, err := rt.db.GetAccount(accountID, true)
	if err != nil {
		if _, ok := err.(persistence.ErrUnknownAccount); ok {
			respondWithError(w, fmt.Errorf("account %s not found", accountID), http.StatusNotFound)
			return
		}
		rt.logError(err, "error looking up account")
		respondWithError(w, err, http.StatusInternalServerError)
	}
	b, err := json.Marshal(&result)
	if err != nil {
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(b)
}
