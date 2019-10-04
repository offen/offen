package router

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (rt *router) getHealth(c *gin.Context) {
	if err := rt.db.CheckHealth(); err != nil {
		newJSONError(
			fmt.Errorf("router: failed checking health of connected persistence layer: %v", err),
			http.StatusBadGateway,
		).Pipe(c)
		return
	}
	c.JSON(http.StatusOK, map[string]bool{"ok": true})
}
