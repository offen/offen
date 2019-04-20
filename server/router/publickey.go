package router

import (
	"encoding/json"
	"net/http"
)

func (rt *router) getPublicKey(w http.ResponseWriter, r *http.Request) {
	account, err := rt.db.GetAccount(r.URL.Query().Get("account_id"))
	if err != nil {
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}
	b, err := json.Marshal(account)
	if err != nil {
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(b)
}
