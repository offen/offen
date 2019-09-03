package router

import (
	"encoding/json"
	"errors"
	"net/http"

	httputil "github.com/offen/offen/server/shared/http"
)

type loginCredentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (rt *router) postLogin(w http.ResponseWriter, r *http.Request) {
	var credentials loginCredentials
	if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
		httputil.RespondWithJSONError(w, err, http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	result, err := rt.db.Login(credentials.Username, credentials.Password)
	if err != nil {
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	b, _ := json.Marshal(result)
	w.Write(b)
}

func (rt *router) getLogin(w http.ResponseWriter, r *http.Request) {
	httputil.RespondWithJSONError(w, errors.New("not implemented yet"), http.StatusUnauthorized)
}
