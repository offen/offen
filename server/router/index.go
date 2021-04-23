// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/css"
)

func (rt *router) getIndex(c *gin.Context) {
	if c.Request.URL.Path == "/vault/" {

		accountID := c.Request.URL.Query().Get("accountId")
		if accountID == "" {
			c.HTML(http.StatusOK, "vault", map[string]interface{}{
				"accountStyles": nil,
			})
			return
		}

		cache, cacheKey := rt.getCache(), fmt.Sprintf("account-styles-%s", accountID)
		if cachedItem, ok := cache.Get(cacheKey); ok {
			cachedStyles, castOk := cachedItem.(string)
			if !castOk {
				c.HTML(http.StatusInternalServerError, "bad_cache", map[string]string{
					"message": fmt.Sprintf("Unexpected cache item for account %s", accountID),
				})
			}

			c.HTML(http.StatusOK, "vault", map[string]interface{}{
				"accountStyles": template.CSS(cachedStyles),
			})
			return
		}

		account, err := rt.db.GetAccount(accountID, true, false, "")
		if err != nil {
			c.HTML(http.StatusBadRequest, "not_found", map[string]string{
				"message": fmt.Sprintf("Error %v looking up account %s", err, accountID),
			})
			return
		}

		ttl := 5 * time.Minute
		if rt.config.App.Development || rt.config.App.DemoAccount != "" {
			ttl = 1 * time.Second
		}
		cache.Set(cacheKey, account.AccountStyles, ttl)

		styles := account.AccountStyles
		if styles != "" {
			if err := css.ValidateCSS(styles); err != nil {
				styles = ""
				rt.logger.WithError(err).Warn("Custom styles in database did not pass sanitizing, default styling will apply.")
			}
		}

		c.HTML(http.StatusOK, "vault", map[string]interface{}{
			"accountStyles": template.CSS(styles),
		})
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
