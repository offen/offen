package router

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gofrs/uuid"
	"github.com/offen/offen/server/persistence"
)

type setupRequest struct {
	AccountName  string `json:"accountName"`
	EmailAddress string `json:"emailAddress"`
	Password     string `json:"password"`
}

func (rt *router) postSetup(c *gin.Context) {
	var req setupRequest
	if err := c.BindJSON(&req); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding request payload: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	accountID, err := uuid.NewV4()
	if err != nil {
		newJSONError(
			fmt.Errorf("router: error creating account id: %w", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}

	if err := rt.db.Bootstrap(persistence.BootstrapConfig{
		Accounts: []persistence.BootstrapAccount{
			{
				Name:      req.AccountName,
				AccountID: accountID.String(),
			},
		},
		AccountUsers: []persistence.BootstrapAccountUser{
			{
				Email:    req.EmailAddress,
				Password: req.Password,
				Accounts: []string{accountID.String()},
			},
		},
	}); err != nil {
		newJSONError(
			fmt.Errorf("router: error running bootstrap: %w", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	c.JSON(http.StatusNoContent, nil)
}
