// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/mailer"
	"github.com/offen/offen/server/persistence"
)

type shareAccountRequest struct {
	InviteeEmailAddress  string `json:"invitee"`
	ProviderEmailAddress string `json:"emailAddress"`
	ProviderPassword     string `json:"password"`
	URLTemplate          string `json:"urlTemplate"`
	GrantAdminPrivileges bool   `json:"grantAdminPrivileges"`
}

func (rt *router) postShareAccount(c *gin.Context) {
	var req shareAccountRequest
	if err := c.BindJSON(&req); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding response body: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	accountUser, ok := c.Value(contextKeyAuth).(persistence.LoginResult)
	if !ok {
		newJSONError(
			errors.New("router: could not find account user object in request context"),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	accountID := c.Param("accountID")
	if accountID != "" {
		if !accountUser.CanAccessAccount(accountID) {
			newJSONError(
				fmt.Errorf("router: user is not allowed to access account %s", accountID),
				http.StatusUnauthorized,
			).Pipe(c)
			return
		}
	}

	// the given credentials might not be valid
	accountInRequest, err := rt.db.Login(req.ProviderEmailAddress, req.ProviderPassword)
	if err != nil {
		newJSONError(
			fmt.Errorf("router: error validating given credentials: %w", err),
			http.StatusUnauthorized,
		).Pipe(c)
		return
	}

	// the given credentials might be valid, but belong to a different user
	// than the one who is calling this
	if accountInRequest.AccountUserID != accountUser.AccountUserID {
		newJSONError(
			fmt.Errorf("router: given credentials belong to user other than requester with id %s", accountUser.AccountUserID),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	if !accountInRequest.IsSuperAdmin() {
		newJSONError(
			errors.New("router: given credentials are not allowed to share accounts"),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	result, err := rt.db.ShareAccount(req.InviteeEmailAddress, req.ProviderEmailAddress, req.ProviderPassword, c.Param("accountID"), req.GrantAdminPrivileges)
	if err != nil {
		newJSONError(
			fmt.Errorf("router: error inviting user: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	// the user might have access to all accounts already in which case we
	// do not want to send a confusing email
	if len(result.AccountNames) == 0 {
		newJSONError(
			fmt.Errorf("router: user already has access to all requested accounts"),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	var emailBody string
	var bodyErr error
	var subject string
	if result.UserExistsWithPassword {
		emailBody, bodyErr = mailer.RenderMessage(
			mailer.MessageExistingUserInvite,
			map[string]interface{}{"accountNames": result.AccountNames},
		)
		subject = string(mailer.SubjectExistingUserInvite)
	} else {
		signedCredentials, signErr := rt.cookieSigner.MaxAge(7*24*60*60).Encode("credentials", req.InviteeEmailAddress)
		if signErr != nil {
			rt.logError(signErr, "error signing token")
			c.Status(http.StatusNoContent)
			return
		}
		joinURL := strings.Replace(req.URLTemplate, "{token}", signedCredentials, -1)
		emailBody, bodyErr = mailer.RenderMessage(
			mailer.MessageNewUserInvite,
			map[string]interface{}{"url": joinURL},
		)
		subject = string(mailer.SubjectNewUserInvite)
	}

	if bodyErr != nil {
		newJSONError(
			fmt.Errorf("router: error rendering email message: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	if err := rt.mailer.Send(rt.config.SMTP.Sender, req.InviteeEmailAddress, subject, emailBody); err != nil {
		newJSONError(
			fmt.Errorf("router: error sending email message: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	c.Status(http.StatusNoContent)
}

type joinRequest struct {
	EmailAddress string `json:"emailAddress"`
	Password     string `json:"password"`
	Token        string `json:"token"`
}

func (rt *router) postJoin(c *gin.Context) {
	var req joinRequest
	if err := c.BindJSON(&req); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding response body: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}
	var email string
	if err := rt.cookieSigner.Decode("credentials", req.Token, &email); err != nil {
		newJSONError(
			fmt.Errorf("error decoding signed token: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}
	if email != req.EmailAddress {
		newJSONError(
			errors.New("given email address did not match token"),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}
	if err := rt.db.Join(req.EmailAddress, req.Password); err != nil {
		rt.logError(err, "error joining")
	}
	c.Status(http.StatusNoContent)
}
