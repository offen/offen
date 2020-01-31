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

type loginCredentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (rt *router) postLogout(c *gin.Context) {
	authCookie, authCookieErr := rt.authCookie("", c.GetBool(contextKeySecureContext))
	if authCookieErr != nil {
		jsonErr := newJSONError(
			fmt.Errorf("router: error creating auth cookie: %w", authCookieErr),
			http.StatusInternalServerError,
		)
		c.JSON(jsonErr.Status, jsonErr)
		return
	}

	http.SetCookie(c.Writer, authCookie)
	c.JSON(http.StatusNoContent, nil)
}

func (rt *router) postLogin(c *gin.Context) {
	var credentials loginCredentials
	if err := c.BindJSON(&credentials); err != nil {
		jsonErr := newJSONError(
			fmt.Errorf("router: error decoding request payload: %w", err),
			http.StatusBadRequest,
		)
		c.JSON(jsonErr.Status, jsonErr)
		return
	}

	result, err := rt.db.Login(credentials.Username, credentials.Password)
	if err != nil {
		jsonErr := newJSONError(
			fmt.Errorf("router: error logging in: %w", err),
			http.StatusUnauthorized,
		)
		c.JSON(jsonErr.Status, jsonErr)
		return
	}

	authCookie, authCookieErr := rt.authCookie(result.AccountUserID, c.GetBool(contextKeySecureContext))
	if authCookieErr != nil {
		jsonErr := newJSONError(
			fmt.Errorf("router: error creating auth cookie: %w", authCookieErr),
			http.StatusInternalServerError,
		)
		c.JSON(jsonErr.Status, jsonErr)
		return
	}

	http.SetCookie(c.Writer, authCookie)
	c.JSON(http.StatusOK, result)
}

func (rt *router) getLogin(c *gin.Context) {
	accountUser, ok := c.Value(contextKeyAuth).(persistence.LoginResult)
	if !ok {
		authCookie, _ := rt.authCookie("", c.GetBool(contextKeySecureContext))
		http.SetCookie(c.Writer, authCookie)
		newJSONError(
			errors.New("could not authorize request"),
			http.StatusUnauthorized,
		).Pipe(c)
		return
	}
	c.JSON(http.StatusOK, map[string]string{"accountUserId": accountUser.AccountUserID})
}

type changePasswordRequest struct {
	ChangedPassword string `json:"changedPassword"`
	CurrentPassword string `json:"currentPassword"`
}

func (rt *router) postChangePassword(c *gin.Context) {
	user, ok := c.Value(contextKeyAuth).(persistence.LoginResult)
	if !ok {
		newJSONError(
			errors.New("router: account user object not found on request context"),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	var req changePasswordRequest
	if err := c.BindJSON(&req); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding request payload: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}
	if err := rt.db.ChangePassword(user.AccountUserID, req.CurrentPassword, req.ChangedPassword); err != nil {
		newJSONError(
			fmt.Errorf("router: error changing password: %w", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	cookie, _ := rt.authCookie("", c.GetBool(contextKeySecureContext))
	http.SetCookie(c.Writer, cookie)
	c.Status(http.StatusNoContent)
}

type changeEmailRequest struct {
	EmailAddress string `json:"emailAddress"`
	Password     string `json:"password"`
}

func (rt *router) postChangeEmail(c *gin.Context) {
	accountUser, ok := c.Value(contextKeyAuth).(persistence.LoginResult)
	if !ok {
		newJSONError(
			errors.New("router: account user object not found on request context"),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	var req changeEmailRequest
	if err := c.BindJSON(&req); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding request payload: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}
	if err := rt.db.ChangeEmail(accountUser.AccountUserID, req.EmailAddress, req.Password); err != nil {
		newJSONError(
			fmt.Errorf("router: error changing email address: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	cookie, _ := rt.authCookie("", c.GetBool(contextKeySecureContext))
	http.SetCookie(c.Writer, cookie)
	c.Status(http.StatusNoContent)
}

type forgotPasswordRequest struct {
	EmailAddress string `json:"emailAddress"`
	URLTemplate  string `json:"urlTemplate"`
}

type forgotPasswordCredentials struct {
	Token        []byte
	EmailAddress string
}

func (rt *router) postForgotPassword(c *gin.Context) {
	// this route responds to erroneous requests with 204 status codes on
	// purpose in order not to leak information about existing accounts
	// to attackers that try to brute force a successful login
	var req forgotPasswordRequest
	if err := c.BindJSON(&req); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding request body: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}
	token, err := rt.db.GenerateOneTimeKey(req.EmailAddress)
	if err != nil {
		rt.logError(err, "error generating one time key")
		c.Status(http.StatusNoContent)
		return
	}
	signedCredentials, signErr := rt.cookieSigner.MaxAge(24*60*60).Encode("credentials", forgotPasswordCredentials{
		Token:        token,
		EmailAddress: req.EmailAddress,
	})
	if signErr != nil {
		rt.logError(signErr, "error signing token")
		c.Status(http.StatusNoContent)
		return
	}

	resetURL := strings.Replace(req.URLTemplate, "{token}", signedCredentials, -1)
	emailBody, bodyErr := mailer.RenderForgotPasswordMessage(map[string]string{"url": resetURL})
	if bodyErr != nil {
		newJSONError(
			fmt.Errorf("router: error rendering email message: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	// TODO: make email sender configurable
	if err := rt.mailer.Send("no-reply@offen.dev", req.EmailAddress, "Reset your password", emailBody); err != nil {
		newJSONError(
			fmt.Errorf("error sending email message: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	c.Status(http.StatusNoContent)
}

type resetPasswordRequest struct {
	EmailAddress string `json:"emailAddress"`
	Password     string `json:"password"`
	Token        string `json:"token"`
}

func (rt *router) postResetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.BindJSON(&req); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding response body: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}
	var credentials forgotPasswordCredentials
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

	if err := rt.db.ResetPassword(req.EmailAddress, req.Password, credentials.Token); err != nil {
		rt.logError(err, "error resetting password")
	}
	c.Status(http.StatusNoContent)
}
