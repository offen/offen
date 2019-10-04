package router

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/persistence"
)

func (rt *router) getAccount(c *gin.Context) {
	accountID := c.Param("accountID")

	user, ok := c.Value("contextKeyAuth").(persistence.LoginResult)
	if !ok {
		newJSONError(
			errors.New("could not find user object in request context"),
			http.StatusNotFound,
		).Respond(c)
		return
	}

	if ok := user.CanAccessAccount(accountID); !ok {
		newJSONError(
			fmt.Errorf("user does not have permissions to access account %s", accountID),
			http.StatusForbidden,
		).Respond(c)
		return
	}

	result, err := rt.db.GetAccount(accountID, true, c.Query("since"))
	if err != nil {
		if _, ok := err.(persistence.ErrUnknownAccount); ok {
			newJSONError(
				fmt.Errorf("account %s not found", accountID),
				http.StatusNotFound,
			).Respond(c)
			return
		}
		newJSONError(
			fmt.Errorf("router: error looking up account: %v", err),
			http.StatusInternalServerError,
		).Respond(c)
		return
	}
	c.JSON(http.StatusOK, result)
}

type accountPayload struct {
	AccountID string `json:"accountId"`
}
