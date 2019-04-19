package router

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"

	"github.com/offen/offen/server/persistence"
	"github.com/offen/offen/server/persistence/relational"
)

type router struct {
	db persistence.Database
}

type getQuery struct {
	params url.Values
	userID string
}

func (q *getQuery) AccountIDs() []string {
	return q.params["account_id"]
}

func (q *getQuery) UserID() string {
	return q.userID
}

func (q *getQuery) Since() string {
	return q.params.Get("since")
}

func (rt *router) get(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(contextKeyCookie).(string)
	if !ok {
		respondWithError(
			w,
			errors.New("could not use user id in request context"),
			http.StatusInternalServerError,
		)
		return
	}
	query := &getQuery{
		params: r.URL.Query(),
		userID: userID,
	}

	result, err := rt.db.Query(query)
	if err != nil {
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}
	// the query result gets wrapped in a top level object before marshalling
	// it into JSON so new data can easily be added or removed
	outbound := map[string]interface{}{
		"events": result,
	}
	if err := json.NewEncoder(w).Encode(outbound); err != nil {
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
	userID, ok := r.Context().Value(contextKeyCookie).(string)
	if !ok {
		respondWithError(
			w,
			errors.New("could not use user id in request context"),
			http.StatusInternalServerError,
		)
		return
	}

	evt := inboundEventPayload{}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&evt); err != nil {
		respondWithError(w, err, http.StatusBadRequest)
		return
	}

	if err := rt.db.Insert(userID, evt.AccountID, evt.Payload); err != nil {
		if unknownAccountErr, ok := err.(relational.ErrUnknownAccount); ok {
			respondWithError(w, unknownAccountErr, http.StatusBadRequest)
			return
		}
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

type contextKey int

const (
	contextKeyCookie contextKey = iota
)

func (rt *router) status(w http.ResponseWriter, r *http.Request) {
	res := statusResponse{true}
	b, _ := json.Marshal(res)
	w.Write(b)
}

const (
	cookieKey = "user"
)

func (rt *router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Add("Content-Type", "application/json")
	switch r.URL.Path {
	case "/events":
		c, err := r.Cookie(cookieKey)
		if err != nil {
			respondWithError(w, err, http.StatusBadRequest)
			return
		}
		if c.Value == "" {
			respondWithError(w, errors.New("received blank user identifier"), http.StatusBadRequest)
			return
		}

		r = r.WithContext(
			context.WithValue(r.Context(), contextKeyCookie, c.Value),
		)

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
