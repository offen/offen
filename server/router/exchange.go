package router

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gofrs/uuid"
	"github.com/offen/offen/server/persistence"
)

func (rt *router) getPublicKey(c *gin.Context) {
	account, err := rt.db.GetAccount(c.Query("accountId"), false, "")
	if err != nil {
		if _, ok := err.(persistence.ErrUnknownAccount); ok {
			newJSONError(
				fmt.Errorf("router: unknown account: %v", err),
				http.StatusBadRequest,
			).Respond(c)
			return
		}
		newJSONError(
			fmt.Errorf("router: error looking up account: %v", err),
			http.StatusInternalServerError,
		).Respond(c)
		return
	}
	c.JSON(http.StatusOK, account)
}

type userSecretPayload struct {
	EncryptedUserSecret string `json:"encryptedUserSecret"`
	AccountID           string `json:"accountId"`
}

func (rt *router) postUserSecret(c *gin.Context) {
	var userID string

	ck, err := c.Request.Cookie(cookieKey)
	if err == nil {
		userID = ck.Value
	} else {
		newID, newIDErr := uuid.NewV4()
		if newIDErr != nil {
			newJSONError(
				fmt.Errorf("router: error generating new user id: %v", newIDErr),
				http.StatusInternalServerError,
			).Respond(c)
			return
		}
		userID = newID.String()
	}

	payload := userSecretPayload{}
	if err := c.BindJSON(&payload); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding response body: %v", err),
			http.StatusBadRequest,
		).Respond(c)
		return
	}

	if err := rt.db.AssociateUserSecret(payload.AccountID, userID, payload.EncryptedUserSecret); err != nil {
		newJSONError(
			fmt.Errorf("router: error associating user secret: %v", err),
			http.StatusBadRequest,
		).Respond(c)
		return
	}

	http.SetCookie(c.Writer, rt.userCookie(userID))
	c.Status(http.StatusNoContent)
}
