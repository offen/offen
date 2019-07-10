package router

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/offen/offen/server/persistence"
	httputil "github.com/offen/offen/server/shared/http"
)

func (rt *router) getAccount(w http.ResponseWriter, r *http.Request) {
	since := r.URL.Query().Get("since")
	accountID := r.URL.Query().Get("accountId")
	if accountID == "" {
		httputil.RespondWithJSONError(w, errors.New("no accountId parameter given"), http.StatusBadRequest)
		return
	}

	result, err := rt.db.GetAccount(accountID, true, since)
	if err != nil {
		if _, ok := err.(persistence.ErrUnknownAccount); ok {
			httputil.RespondWithJSONError(w, fmt.Errorf("account %s not found", accountID), http.StatusNotFound)
			return
		}
		rt.logError(err, "error looking up account")
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	b, err := json.Marshal(&result)
	if err != nil {
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(b)
}

type accountPayload struct {
	Name      string `json:"name"`
	AccountID string `json:"account_id"`
}

func (rt *router) postAccount(w http.ResponseWriter, r *http.Request) {
	var payload accountPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httputil.RespondWithJSONError(w, fmt.Errorf("router: error parsing request payload: %v", err), http.StatusBadRequest)
		return
	}
	fmt.Println("aacount", payload)
	if err := rt.db.CreateAccount(payload.AccountID, payload.Name); err != nil {
		httputil.RespondWithJSONError(w, fmt.Errorf("router: error creating account: %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
