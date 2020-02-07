package router

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type inviteUserRequest struct {
	EmailAddress string `json:"emailAddress"`
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
	c.Status(http.StatusNoContent)
}
