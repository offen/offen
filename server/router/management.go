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

type inviteUserRequest struct {
	InviteeEmailAddress  string `json:"invitee"`
	ProviderEmailAddress string `json:"emailAddress"`
	ProviderPassword     string `json:"password"`
	URLTemplate          string `json:"urlTemplate"`
}

type invitationCredentials struct {
	EmailAddress string
	AccountIDs   []string
}

func (rt *router) postInviteUser(c *gin.Context) {
	var req inviteUserRequest
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
			http.StatusNotFound,
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

	result, err := rt.db.InviteUser(req.InviteeEmailAddress, req.ProviderEmailAddress, req.ProviderPassword, c.Param("accountID"))
	if err != nil {
		newJSONError(
			fmt.Errorf("router: error inviting user: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	signedCredentials, signErr := rt.cookieSigner.MaxAge(7*24*60*60).Encode("credentials", invitationCredentials{
		AccountIDs:   result.AccountIDs,
		EmailAddress: req.InviteeEmailAddress,
	})
	if signErr != nil {
		rt.logError(signErr, "error signing token")
		c.Status(http.StatusNoContent)
		return
	}

	joinURL := strings.Replace(req.URLTemplate, "{token}", signedCredentials, -1)

	var emailBody string
	var bodyErr error
	var subject string
	if result.UserExistsWithPassword {
		joinURL = strings.Replace(joinURL, "{userId}", "addition", -1)
		emailBody, bodyErr = mailer.RenderMessage(mailer.MessageExistingUserInvite, map[string]string{"url": joinURL})
		subject = "You have been added to additional accounts on Offen"
	} else {
		joinURL = strings.Replace(joinURL, "{userId}", "new", -1)
		emailBody, bodyErr = mailer.RenderMessage(mailer.MessageNewUserInvite, map[string]string{"url": joinURL})
		subject = "You have been invited to join Offen"
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
	var credentials invitationCredentials
	if err := rt.cookieSigner.Decode("credentials", req.Token, &credentials); err != nil {
		newJSONError(
			fmt.Errorf("error decoding signed token: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}
	if credentials.EmailAddress != req.EmailAddress {
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
