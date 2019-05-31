package router

import (
	"encoding/json"
	"net/http"
)

type statusResponse struct {
	OK bool `json:"ok"`
}

func (rt *router) handleStatus(w http.ResponseWriter, r *http.Request) {
	res := statusResponse{true}
	b, _ := json.Marshal(res)
	w.Write(b)
}
