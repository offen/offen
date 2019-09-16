package router

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"

	"github.com/offen/offen/server/persistence"
)

type inboundEventPayload struct {
	AccountID string `json:"accountId"`
	Payload   string `json:"payload"`
}

type ackResponse struct {
	Ack bool `json:"ack"`
}

var errBadRequestContext = errors.New("could not use user id in request context")

func (rt *router) postEvents(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(contextKeyCookie).(string)
	evt := inboundEventPayload{}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&evt); err != nil {
		respondWithJSONError(w, err, http.StatusBadRequest)
		return
	}

	if err := rt.db.Insert(userID, evt.AccountID, evt.Payload); err != nil {
		if unknownAccountErr, ok := err.(persistence.ErrUnknownAccount); ok {
			respondWithJSONError(w, unknownAccountErr, http.StatusNotFound)
			return
		}
		if unknownUserErr, ok := err.(persistence.ErrUnknownUser); ok {
			respondWithJSONError(w, unknownUserErr, http.StatusBadRequest)
			return
		}
		rt.logError(err, "error writing event payload")
		respondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}

	b, _ := json.Marshal(ackResponse{true})
	// this handler might be called without a cookie / i.e. receiving an
	// anonymous event, in which case it is important **NOT** to re-issue
	// the user cookie.
	if userID != "" {
		http.SetCookie(w, rt.userCookie(userID))
	}
	w.Write(b)
}

type getQuery struct {
	params url.Values
	userID string
}

func (q *getQuery) AccountIDs() []string {
	return q.params["accountId"]
}

func (q *getQuery) UserID() string {
	return q.userID
}

func (q *getQuery) Since() string {
	return q.params.Get("since")
}

type getResponse struct {
	Events map[string][]persistence.EventResult `json:"events"`
}

func (rt *router) getEvents(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(contextKeyCookie).(string)
	if !ok {
		respondWithJSONError(
			w,
			errBadRequestContext,
			http.StatusInternalServerError,
		)
		return
	}
	query := getQuery{
		params: r.URL.Query(),
		userID: userID,
	}

	result, err := rt.db.Query(&query)
	if err != nil {
		respondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	// the query result gets wrapped in a top level object before marshalling
	// it into JSON so new data can easily be added or removed
	outbound := getResponse{
		Events: result,
	}
	b, err := json.Marshal(outbound)
	if err != nil {
		respondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(b)
}

type deletedQuery struct {
	EventIDs []string `json:"eventIds"`
}

func (rt *router) getDeletedEvents(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(contextKeyCookie).(string)

	query := deletedQuery{}
	if err := json.NewDecoder(r.Body).Decode(&query); err != nil {
		respondWithJSONError(w, err, http.StatusBadRequest)
		return
	}
	deleted, err := rt.db.GetDeletedEvents(query.EventIDs, userID)
	if err != nil {
		respondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	out := deletedQuery{
		EventIDs: deleted,
	}
	b, _ := json.Marshal(&out)
	w.Write(b)
}

func (rt *router) purgeEvents(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(contextKeyCookie).(string)
	if err := rt.db.Purge(userID); err != nil {
		respondWithJSONError(w, fmt.Errorf("router: error purging user events: %v", err), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
