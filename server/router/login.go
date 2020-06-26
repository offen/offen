// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"bytes"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/persistence"
)

type loginCredentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (rt *router) postLogout(c *gin.Context) {
	authCookie, authCookieErr := rt.authCookie("", c.GetBool(contextKeySecureContext))
	if authCookieErr != nil {
		newJSONError(
			fmt.Errorf("router: error creating auth cookie: %w", authCookieErr),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}

	http.SetCookie(c.Writer, authCookie)
	c.JSON(http.StatusNoContent, nil)
}

func (rt *router) postLogin(c *gin.Context) {
	var credentials loginCredentials
	if err := c.BindJSON(&credentials); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding request payload: %w", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	if l := <-rt.limiter(time.Second).ExponentialThrottle(fmt.Sprintf("postLogin-%s", credentials.Username)); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error applying rate limit: %w", l.Error),
			http.StatusTooManyRequests,
		).Pipe(c)
		return
	}

	// we rate limit this twice to prevent flooding with arbitrary emails
	if l := <-rt.limiter(time.Second / 2).LinearThrottle("postLogin-*"); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error applying rate limit: %w", l.Error),
			http.StatusTooManyRequests,
		).Pipe(c)
		return
	}

	result, err := rt.db.Login(credentials.Username, credentials.Password)
	if err != nil {
		newJSONError(
			fmt.Errorf("router: error logging in: %w", err),
			http.StatusUnauthorized,
		).Pipe(c)
		return
	}

	authCookie, authCookieErr := rt.authCookie(result.AccountUserID, c.GetBool(contextKeySecureContext))
	if authCookieErr != nil {
		newJSONError(
			fmt.Errorf("router: error creating auth cookie: %w", authCookieErr),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}

	http.SetCookie(c.Writer, authCookie)
	c.JSON(http.StatusOK, result)
}

func (rt *router) getLogin(c *gin.Context) {
	result, ok := c.Value(contextKeyAuth).(persistence.LoginResult)
	if !ok {
		authCookie, _ := rt.authCookie("", c.GetBool(contextKeySecureContext))
		http.SetCookie(c.Writer, authCookie)
		newJSONError(
			errors.New("could not authorize request"),
			http.StatusUnauthorized,
		).Pipe(c)
		return
	}
	c.JSON(http.StatusOK, result)
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

	if l := <-rt.limiter(time.Second * 5).LinearThrottle(fmt.Sprintf("postChangePassword-%s", user.AccountUserID)); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error applying rate limit: %w", l.Error),
			http.StatusTooManyRequests,
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
	EmailCurrent string `json:"emailCurrent"`
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

	if l := <-rt.limiter(time.Second * 5).LinearThrottle(fmt.Sprintf("postChangeEmail-%s", accountUser.AccountUserID)); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error applying rate limit: %w", l.Error),
			http.StatusTooManyRequests,
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
	if err := rt.db.ChangeEmail(accountUser.AccountUserID, req.EmailAddress, req.EmailCurrent, req.Password); err != nil {
		newJSONError(
			fmt.Errorf("router: error changing email address: %v", err),
			http.StatusBadRequest,
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

	if l := <-rt.limiter(time.Second * 5).ExponentialThrottle(fmt.Sprintf("postForgotPassword-%s", req.EmailAddress)); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error applying rate limit: %w", l.Error),
			http.StatusTooManyRequests,
		).Pipe(c)
		return
	}

	// we rate limit this twice to prevent floodding with arbitrary emails
	if l := <-rt.limiter(time.Second * 1).LinearThrottle("postForgotPassword-*"); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error applying rate limit: %w", l.Error),
			http.StatusTooManyRequests,
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

	subject, body := bytes.NewBuffer(nil), bytes.NewBuffer(nil)
	if err := rt.emails.ExecuteTemplate(subject, "subject_reset_password", nil); err != nil {
		newJSONError(
			fmt.Errorf("router: error rendering email subject: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	if err := rt.emails.ExecuteTemplate(body, "body_reset_password", map[string]string{"url": resetURL}); err != nil {
		newJSONError(
			fmt.Errorf("router: error rendering email body: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}

	if err := rt.mailer.Send(rt.config.SMTP.Sender, req.EmailAddress, subject.String(), body.String()); err != nil {
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

	if l := <-rt.limiter(time.Second * 5).ExponentialThrottle(fmt.Sprintf("postResetPassword-%s", credentials.EmailAddress)); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error applying rate limit: %w", l.Error),
			http.StatusTooManyRequests,
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
		// on error a successful status is sent in order not to leak information
		// to attackers
		rt.logError(err, "error resetting password")
	}
	c.Status(http.StatusNoContent)
}
