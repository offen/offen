package router

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/gofrs/uuid"
	"github.com/offen/offen/server/persistence"
	httputil "github.com/offen/offen/server/shared/http"
)

func (rt *router) getPublicKey(w http.ResponseWriter, r *http.Request) {
	account, err := rt.db.GetAccount(r.URL.Query().Get("account_id"), false)
	if err != nil {
		if _, ok := err.(persistence.ErrUnknownAccount); ok {
			httputil.RespondWithJSONError(w, err, http.StatusBadRequest)
			return
		}
		rt.logError(err, "error looking up account")
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	b, err := json.Marshal(account)
	if err != nil {
		rt.logError(err, "error marshaling account to JSON")
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
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
			httputil.RespondWithJSONError(w, newIDErr, http.StatusInternalServerError)
			return
		}
		userID = newID.String()
	}

	payload := userSecretPayload{}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httputil.RespondWithJSONError(w, err, http.StatusBadRequest)
		return
	}

	if err := rt.db.AssociateUserSecret(payload.AccountID, userID, payload.EncryptedUserSecret); err != nil {
		httputil.RespondWithJSONError(w, err, http.StatusBadRequest)
		return
	}

	_, secureCookie := os.LookupEnv("SECURE_COOKIE")
	cookie := newCookie(userID, secureCookie)
	http.SetCookie(w, cookie)

	w.WriteHeader(http.StatusNoContent)
}
