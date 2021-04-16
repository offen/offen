// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"fmt"
	"html/template"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func (rt *router) getIndex(c *gin.Context) {
	if c.Request.URL.Path == "/vault/" {
		var args interface{}
		args = nil
		if accountID := c.Request.URL.Query().Get("accountId"); accountID != "" {
			account, err := rt.db.GetAccount(accountID, false, "")
			if err != nil {
				c.HTML(http.StatusBadRequest, "not_found", map[string]string{
					"message": fmt.Sprintf("Error %v looking up account %s", err, accountID),
				})
				return
			}
			if account.CustomStyles != "" {
				args = map[string]template.CSS{
					"customStyles": template.CSS(account.CustomStyles),
				}
			}
		}
		c.HTML(http.StatusOK, "vault", args)
		return
	}
	if rt.config.App.DemoAccount != "" && strings.HasPrefix(c.Request.URL.Path, "/intro") {
		c.HTML(http.StatusOK, "intro", map[string]interface{}{
			"demoAccount": rt.config.App.DemoAccount,
			"lang":        rt.config.App.Locale,
		})
		return
	}
	c.HTML(http.StatusOK, "index", map[string]interface{}{
		"rootAccount": rt.config.App.RootAccount,
		"lang":        rt.config.App.Locale,
	})
}
