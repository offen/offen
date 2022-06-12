// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"fmt"
	"html/template"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/css"
)

func (rt *router) getVault(c *gin.Context) {
	lang := string(rt.config.App.Locale)
	if override := c.Query("lang"); override != "" {
		lang = override
	}

	accountID := c.Request.URL.Query().Get("accountId")
	if accountID == "" {
		c.HTML(http.StatusOK, "vault", map[string]interface{}{
			"accountStyles": nil,
			"lang":          lang,
		})
		return
	}

	cache, cacheKey := rt.getCache(), fmt.Sprintf("account-styles-%s", accountID)
	if cachedItem, ok := cache.Get(cacheKey); ok {
		cachedStyles, castOk := cachedItem.(string)
		if !castOk {
			c.HTML(http.StatusInternalServerError, "error", map[string]string{
				"message": fmt.Sprintf("Unexpected cache item for account %s", accountID),
			})
			return
		}

		c.HTML(http.StatusOK, "vault", map[string]interface{}{
			"accountStyles": template.CSS(cachedStyles),
			"lang":          lang,
		})
		return
	}

	account, err := rt.db.GetAccount(accountID, true, false, "")
	if err != nil {
		c.HTML(http.StatusBadRequest, "error", map[string]string{
			"message": fmt.Sprintf("Error %v looking up account %s", err, accountID),
		})
		return
	}

	ttl := 5 * time.Minute
	if rt.config.App.Development || rt.config.App.DemoAccount != "" {
		ttl = time.Second
	}

	styles := account.AccountStyles
	if styles != "" {
		if err := css.ValidateCSS(styles); err != nil {
			styles = ""
			rt.logger.WithError(err).Warnf(
				"Custom styles for account %s in database did not pass validation, default styling will apply.",
				account.Name,
			)
		}
	}

	// Writing to the cache at this point means the application _might_ cache
	// an empty string in case the CSS in the database is considered invalid,
	// which might be confusing but mitigates the possibility of attacking the
	// application by inserting malformed CSS into the database.
	cache.Set(cacheKey, styles, ttl)

	c.HTML(http.StatusOK, "vault", map[string]interface{}{
		"accountStyles": template.CSS(styles),
		"lang":          lang,
	})
}

func (rt *router) getIntro(c *gin.Context) {
	c.HTML(http.StatusOK, "intro", map[string]interface{}{
		"demoAccount": rt.config.App.DemoAccount,
		"lang":        rt.config.App.Locale,
	})
	return
}

func (rt *router) getIndex(c *gin.Context) {
	lang := string(rt.config.App.Locale)
	if override := c.Query("lang"); override != "" {
		lang = override
	}
	c.HTML(http.StatusOK, "index", map[string]interface{}{
		"rootAccount": rt.config.App.RootAccount,
		"lang":        lang,
	})
}
