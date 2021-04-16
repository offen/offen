// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func (rt *router) getIndex(c *gin.Context) {
	if c.Request.URL.Path == "/vault/" {
		c.HTML(http.StatusOK, "vault", nil)
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
