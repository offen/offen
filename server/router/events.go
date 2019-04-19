package router

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"

	"github.com/offen/offen/server/persistence"

	"github.com/offen/offen/server/persistence/relational"
)

type inboundEventPayload struct {
	AccountID string `json:"account_id"`
	Payload   string `json:"payload"`
}

type ackResponse struct {
	Ack bool `json:"ack"`
}

var errBadRequestContext = errors.New("could not use user id in request context")

func (rt *router) postEvents(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(contextKeyCookie).(string)
	if !ok {
		respondWithError(
			w,
			errBadRequestContext,
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

	b, _ := json.Marshal(ackResponse{true})
	w.Write(b)
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

type getResponse struct {
	Events []persistence.EventResult `json:"events"`
}

func (rt *router) getEvents(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(contextKeyCookie).(string)
	if !ok {
		respondWithError(
			w,
			errBadRequestContext,
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
	outbound := getResponse{
		Events: result,
	}
	json.NewEncoder(w).Encode(outbound)
}
