package router

import (
	"encoding/json"
	"net/http"

	"github.com/gofrs/uuid"
	"github.com/offen/offen/server/persistence"
)

func (rt *router) getPublicKey(w http.ResponseWriter, r *http.Request) {
	account, err := rt.db.GetAccount(r.URL.Query().Get("accountId"), false, "")
	if err != nil {
		if _, ok := err.(persistence.ErrUnknownAccount); ok {
			respondWithJSONError(w, err, http.StatusBadRequest)
			return
		}
		rt.logError(err, "error looking up account")
		respondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	b, err := json.Marshal(account)
	if err != nil {
		rt.logError(err, "error marshaling account to JSON")
		respondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(b)
}

type userSecretPayload struct {
	EncryptedUserSecret string `json:"encryptedUserSecret"`
	AccountID           string `json:"accountId"`
}

func (rt *router) postUserSecret(w http.ResponseWriter, r *http.Request) {
	var userID string

	c, err := r.Cookie(cookieKey)
	if err == nil {
		userID = c.Value
	} else {
		newID, newIDErr := uuid.NewV4()
		if newIDErr != nil {
			respondWithJSONError(w, newIDErr, http.StatusInternalServerError)
			return
		}
		userID = newID.String()
	}

	payload := userSecretPayload{}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		respondWithJSONError(w, err, http.StatusBadRequest)
		return
	}

	if err := rt.db.AssociateUserSecret(payload.AccountID, userID, payload.EncryptedUserSecret); err != nil {
		respondWithJSONError(w, err, http.StatusBadRequest)
		return
	}

	http.SetCookie(w, rt.userCookie(userID))
	w.WriteHeader(http.StatusNoContent)
}
