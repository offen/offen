package router

import (
	"encoding/json"
	"errors"
	"fmt"
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
		httputil.RespondWithJSONError(w, err, http.StatusUnauthorized)
		return
	}

	b, err := json.Marshal(result)
	if err != nil {
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}

	authCookie, authCookieErr := rt.authCookie(result.UserID, false)
	if authCookieErr != nil {
		httputil.RespondWithJSONError(w, authCookieErr, http.StatusInternalServerError)
		return
	}
	http.SetCookie(w, authCookie)
	w.Write(b)
}

func (rt *router) getLogin(w http.ResponseWriter, r *http.Request) {
	authCookie, err := r.Cookie(authKey)
	if err != nil {
		httputil.RespondWithJSONError(w, errors.New("no auth cookie present"), http.StatusUnauthorized)
		return
	}
	var userID string
	if err := rt.cookieSigner.Decode(authKey, authCookie.Value, &userID); err != nil {
		authCookie, _ = rt.authCookie("", true)
		http.SetCookie(w, authCookie)
		httputil.RespondWithJSONError(w, fmt.Errorf("error decoding cookie value: %v", err), http.StatusUnauthorized)
		return
	}
	if err := rt.db.LookupUser(userID); err != nil {
		authCookie, _ = rt.authCookie("", true)
		http.SetCookie(w, authCookie)
		httputil.RespondWithJSONError(w, fmt.Errorf("user with id %s does not exist: %v", userID, err), http.StatusNotFound)
		return
	}
	b, _ := json.Marshal(map[string]string{"userId": userID})
	w.Write(b)
}
