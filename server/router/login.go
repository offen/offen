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

type forgotPasswordRequest struct {
	EmailAddress string `json:"emailAddress"`
}

func (rt *router) postForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req forgotPasswordRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithJSONError(w, fmt.Errorf("error decoding request body: %v", err), http.StatusBadRequest)
		return
	}
	token, err := rt.db.GenerateOneTimeKey(req.EmailAddress)
	if err != nil {
		rt.logError(err, "error generating one time key")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	signedToken, signErr := rt.cookieSigner.MaxAge(24*60*60).Encode("reset", token)
	if signErr != nil {
		rt.logError(signErr, "error signing token")
		w.WriteHeader(http.StatusNoContent)
		return
	}

	fmt.Println("TOKEN", signedToken)
	w.WriteHeader(http.StatusNoContent)
}

type resetPasswordRequest struct {
	EmailAddress string `json:"emailAddress"`
	Password     string `json:"password"`
	Token        string `json:"token"`
}

func (rt *router) postResetPassword(w http.ResponseWriter, r *http.Request) {
	var req resetPasswordRequest
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithJSONError(w, fmt.Errorf("error decoding response body: %v", err), http.StatusBadRequest)
		return
	}
	var key []byte
	if err := rt.cookieSigner.Decode("reset", req.Token, &key); err != nil {
		respondWithJSONError(w, fmt.Errorf("error decoding signed token: %v", err), http.StatusBadRequest)
		return
	}

	if err := rt.db.ResetPassword(req.EmailAddress, req.Password, key); err != nil {
		rt.logError(err, "error resetting password")
	}
	w.WriteHeader(http.StatusNoContent)
}
