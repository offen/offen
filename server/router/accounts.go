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

	accountUser, ok := c.Value(contextKeyAuth).(persistence.LoginResult)
	if !ok {
		newJSONError(
			errors.New("router: could not find account user object in request context"),
			http.StatusNotFound,
		).Pipe(c)
		return
	}

	if ok := accountUser.CanAccessAccount(accountID); !ok {
		newJSONError(
			fmt.Errorf("router: account user does not have permissions to access account %s", accountID),
			http.StatusForbidden,
		).Pipe(c)
		return
	}

	result, err := rt.db.GetAccount(accountID, true, c.Query("since"))
	if err != nil {
		if _, ok := err.(persistence.ErrUnknownAccount); ok {
			newJSONError(
				fmt.Errorf("router: account %s not found", accountID),
				http.StatusNotFound,
			).Pipe(c)
			return
		}
		newJSONError(
			fmt.Errorf("router: error looking up account: %w", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	c.JSON(http.StatusOK, result)
}

type createAccountRequest struct {
	AccountName  string `json:"accountName"`
	EmailAddress string `json:"emailAddress"`
	Password     string `json:"password"`
}

func (rt *router) postAccount(c *gin.Context) {
	var req createAccountRequest
	if err := c.BindJSON(&req); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding response body: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}
	if err := rt.db.CreateAccount(req.AccountName, req.EmailAddress, req.Password); err != nil {
		newJSONError(
			fmt.Errorf("router: error creating account %s: %w", req.AccountName, err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	c.JSON(http.StatusCreated, nil)
}
