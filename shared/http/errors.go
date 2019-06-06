package http

import (
	"encoding/json"
	"net/http"
)

type errorResponse struct {
	Error  string `json:"error"`
	Status int    `json:"status"`
}

func jsonError(err error, status int) []byte {
	r := errorResponse{err.Error(), status}
	b, _ := json.Marshal(r)
	return b
}

func RespondWithJSONError(w http.ResponseWriter, err error, status int) {
	w.WriteHeader(status)
	w.Write(jsonError(err, status))
}
