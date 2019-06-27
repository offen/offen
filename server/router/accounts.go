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
	accountID := r.URL.Query().Get("accountId")
	if accountID == "" {
		httputil.RespondWithJSONError(w, errors.New("no accountId parameter given"), http.StatusBadRequest)
		return
	}
	result, err := rt.db.GetAccount(accountID, true)
	if err != nil {
		if _, ok := err.(persistence.ErrUnknownAccount); ok {
			httputil.RespondWithJSONError(w, fmt.Errorf("account %s not found", accountID), http.StatusNotFound)
			return
		}
		rt.logError(err, "error looking up account")
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
	}
	b, err := json.Marshal(&result)
	if err != nil {
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(b)
}
