package router

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gofrs/uuid"
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

type userSecretPayload struct {
	EncryptedUserSecret string `json:"encrypted_user_secret"`
	AccountID           string `json:"account_id"`
}

func (rt *router) postUserSecret(w http.ResponseWriter, r *http.Request) {
	var userID string

	c, err := r.Cookie(cookieKey)
	if err == nil {
		userID = c.Value
	} else {
		newID, newIDErr := uuid.NewV4()
		if newIDErr != nil {
			respondWithError(w, newIDErr, http.StatusInternalServerError)
			return
		}
		userID = newID.String()
	}

	payload := userSecretPayload{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondWithError(w, err, http.StatusBadRequest)
		return
	}

	if err := rt.db.AssociateUserSecret(payload.AccountID, userID, payload.EncryptedUserSecret); err != nil {
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     cookieKey,
		Value:    userID,
		Expires:  time.Now().Add(time.Hour * 24 * 365),
		HttpOnly: true,
		Domain:   ".offen.org",
	})

	w.WriteHeader(http.StatusCreated)
}
