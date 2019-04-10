package router

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/offen/offen/server/persistence"
)

type router struct {
	db persistence.Database
}

func (rt *router) get(w http.ResponseWriter, r *http.Request) {
	result, err := rt.db.Query()
	if err != nil {
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}
	if err := json.NewEncoder(w).Encode(result); err != nil {
		respondWithError(w, err, http.StatusInternalServerError)
	}
}

type ackResponse struct {
	Ack bool `json:"ack"`
}

type inboundEventPayload struct {
	AccountID string `json:"account_id"`
	Payload   string `json:"payload"`
}

func (rt *router) post(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("user")
	if err != nil {
		respondWithError(w, err, http.StatusBadRequest)
		return
	}

	evt := inboundEventPayload{}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&evt); err != nil {
		respondWithError(w, err, http.StatusBadRequest)
		return
	}

	if err := rt.db.Insert(c.Value, evt.AccountID, evt.Payload); err != nil {
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}

	b, err := json.Marshal(ackResponse{true})
	if err != nil {
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(b)
}

type statusResponse struct {
	OK bool `json:"ok"`
}

func (rt *router) status(w http.ResponseWriter, r *http.Request) {
	res := statusResponse{true}
	b, _ := json.Marshal(res)
	w.Write(b)
}

func (rt *router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")
	switch r.URL.Path {
	case "/":
		switch r.Method {
		case http.MethodGet:
			rt.get(w, r)
		case http.MethodPost:
			rt.post(w, r)
		default:
			respondWithError(w, errors.New("Method not allowed"), http.StatusMethodNotAllowed)
		}
	case "/status":
		rt.status(w, r)
	default:
		respondWithError(w, errors.New("Not found"), http.StatusNotFound)
	}
}

// New creates a new application router that reads and writes data
// to the given database implementation. In the context of the application
// this expects to be the only top level router in charge of handling all
// incoming HTTP requests.
func New(db persistence.Database) http.Handler {
	return &router{db}
}
