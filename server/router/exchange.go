// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gofrs/uuid"
	"github.com/offen/offen/server/persistence"
)

func (rt *router) getPublicKey(c *gin.Context) {
	account, err := rt.db.GetAccount(c.Query("accountId"), false, "")
	if err != nil {
		var unknownAccountErr persistence.ErrUnknownAccount
		if errors.As(err, &unknownAccountErr) {
			newJSONError(
				fmt.Errorf("router: unknown account: %w", unknownAccountErr),
				http.StatusBadRequest,
			).Pipe(c)
			return
		}
		newJSONError(
			fmt.Errorf("router: error looking up account: %w", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	c.JSON(http.StatusOK, account)
}

type userSecretPayload struct {
	EncryptedUserSecret string `json:"encryptedSecret"`
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
			).Pipe(c)
			return
		}
		userID = newID.String()
	}

	payload := userSecretPayload{}
	if err := c.BindJSON(&payload); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding response body: %v", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	if l := <-rt.getLimiter().LinearThrottle(time.Second, fmt.Sprintf("postUserSecret-%s", userID)); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error rate limiting request: %w", l.Error),
			http.StatusTooManyRequests,
		).Pipe(c)
		return
	}

	if err := rt.db.AssociateUserSecret(payload.AccountID, userID, payload.EncryptedUserSecret); err != nil {
		newJSONError(
			fmt.Errorf("router: error associating user secret: %v", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	http.SetCookie(
		c.Writer,
		rt.userCookie(userID, c.GetBool(contextKeySecureContext)),
	)
	c.Status(http.StatusNoContent)
}
