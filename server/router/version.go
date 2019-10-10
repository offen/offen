package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type versionInfo struct {
	Revision string `json:"revision"`
}

func (rt *router) getVersion(c *gin.Context) {
	// this endpoint is mostly to be consumed by humans, so
	// we pretty print the output
	c.IndentedJSON(http.StatusOK, versionInfo{
		Revision: rt.revision,
	})
}
