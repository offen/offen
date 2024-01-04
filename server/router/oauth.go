// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (rt *router) oauthLogin(c *gin.Context) {
	c.Redirect(http.StatusTemporaryRedirect, rt.oidc.GetAuthorizationURL())
}

func (rt *router) oauthCallback(c *gin.Context) {
	token, err := rt.oidc.Callback(c.Request.FormValue("code"), c.Request.FormValue("state"))
	if err != nil {
		newJSONError(
			fmt.Errorf("router: authentication failed: %w", err),
			http.StatusUnauthorized,
		).Pipe(c)
		return
	}

	result, err := rt.db.LoginSSO(token.Email(), string(rt.config.Secret))
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

func (rt *router) oauthLogout(c *gin.Context) {
}
