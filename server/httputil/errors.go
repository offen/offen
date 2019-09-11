package httputil

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

// RespondWithJSONError writes the given error to the given response writer
// while wrapping it into a JSON payload.
func RespondWithJSONError(w http.ResponseWriter, err error, status int) {
	w.WriteHeader(status)
	w.Write(jsonError(err, status))
}
