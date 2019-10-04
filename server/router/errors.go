package router

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

type errorResponse struct {
	Error  string `json:"error"`
	Status int    `json:"status"`
}

func (e *errorResponse) Respond(c *gin.Context) {
	c.JSON(e.Status, e)
}

func jsonError(err error, status int) []byte {
	r := errorResponse{err.Error(), status}
	b, _ := json.Marshal(r)
	return b
}

func newJSONError(err error, status int) *errorResponse {
	return &errorResponse{
		Error:  err.Error(),
		Status: status,
	}
}

func respondWithJSONError(w http.ResponseWriter, err error, status int) {
	w.WriteHeader(status)
	w.Write(jsonError(err, status))
}
