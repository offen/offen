package router

import (
	"fmt"
	"net/http"
)

func (rt *router) getHealth(w http.ResponseWriter, r *http.Request) {
	if err := rt.db.CheckHealth(); err != nil {
		respondWithJSONError(w, fmt.Errorf("failed checking health of connected persistence layer: %v", err), http.StatusBadGateway)
		return
	}
	w.WriteHeader(http.StatusOK)
}
