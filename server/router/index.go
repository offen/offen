// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (rt *router) getIndex(c *gin.Context) {
	c.HTML(http.StatusOK, "index", map[string]interface{}{
		"rootAccount": rt.config.App.RootAccount,
		"lang":        rt.config.App.Locale,
	})
}
