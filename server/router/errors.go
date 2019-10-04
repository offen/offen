package router

import "github.com/gin-gonic/gin"

type errorResponse struct {
	Error  string `json:"error"`
	Status int    `json:"status"`
}

func (e *errorResponse) Pipe(c *gin.Context) {
	c.JSON(e.Status, e)
}

func newJSONError(err error, status int) *errorResponse {
	return &errorResponse{
		Error:  err.Error(),
		Status: status,
	}
}
