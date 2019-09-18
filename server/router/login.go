package router

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/offen/offen/server/persistence"
)

type loginCredentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (rt *router) postLogin(w http.ResponseWriter, r *http.Request) {
	var credentials loginCredentials
	if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
		respondWithJSONError(w, err, http.StatusBadRequest)
		return
	}
	defer r.Body.Close()
	result, err := rt.db.Login(credentials.Username, credentials.Password)
	if err != nil {
		respondWithJSONError(w, err, http.StatusUnauthorized)
		return
	}

	b, err := json.Marshal(result)
	if err != nil {
		respondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}

	authCookie, authCookieErr := rt.authCookie(result.UserID)
	if authCookieErr != nil {
		respondWithJSONError(w, authCookieErr, http.StatusInternalServerError)
		return
	}
	http.SetCookie(w, authCookie)
	w.Write(b)
}

func (rt *router) getLogin(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(contextKeyAuth).(persistence.LoginResult)
	if !ok {
		authCookie, _ := rt.authCookie("")
		http.SetCookie(w, authCookie)
		respondWithJSONError(w, errors.New("could not authorize request"), http.StatusUnauthorized)
		return
	}
	b, _ := json.Marshal(map[string]string{"userId": user.UserID})
	w.Write(b)
}

type changePasswordRequest struct {
	ChangedPassword string `json:"changedPassword"`
	CurrentPassword string `json:"currentPassword"`
}

func (rt *router) postChangePassword(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(contextKeyAuth).(persistence.LoginResult)
	if !ok {
		respondWithJSONError(w, errors.New("user object not found on request context"), http.StatusInternalServerError)
		return
	}
	var req changePasswordRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithJSONError(w, fmt.Errorf("error decoding request payload: %v", err), http.StatusBadRequest)
		return
	}
	if err := rt.db.ChangePassword(user.UserID, req.CurrentPassword, req.ChangedPassword); err != nil {
		respondWithJSONError(w, fmt.Errorf("error changing password: %v", err), http.StatusInternalServerError)
		return
	}
	cookie, _ := rt.authCookie("")
	http.SetCookie(w, cookie)
	w.WriteHeader(http.StatusNoContent)
}

type changeEmailRequest struct {
	EmailAddress string `json:"emailAddress"`
	Password     string `json:"password"`
}

func (rt *router) postChangeEmail(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(contextKeyAuth).(persistence.LoginResult)
	if !ok {
		respondWithJSONError(w, errors.New("user object not found on request context"), http.StatusInternalServerError)
		return
	}
	var req changeEmailRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithJSONError(w, fmt.Errorf("error decoding request payload: %v", err), http.StatusBadRequest)
		return
	}
	if err := rt.db.ChangeEmail(user.UserID, req.EmailAddress, req.Password); err != nil {
		respondWithJSONError(w, fmt.Errorf("error changing email address: %v", err), http.StatusInternalServerError)
		return
	}
	cookie, _ := rt.authCookie("")
	http.SetCookie(w, cookie)
	w.WriteHeader(http.StatusNoContent)
}
