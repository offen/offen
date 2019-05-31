package router

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/offen/offen/server/persistence"
)

type mockInsertDatabase struct {
	persistence.Database
	err error
}

func (m *mockInsertDatabase) Insert(string, string, string) error {
	return m.err
}

func TestRouter_PostEvents(t *testing.T) {
	tests := []struct {
		name               string
		db                 persistence.Database
		body               io.Reader
		userID             interface{}
		expectedStatusCode int
		expectedResponse   string
	}{
		{
			"empty body",
			&mockInsertDatabase{},
			nil,
			"user-identifier",
			http.StatusBadRequest,
			`{"error":"EOF","status":400}`,
		},
		{
			"malformed body",
			&mockInsertDatabase{},
			bytes.NewReader([]byte("this is not really json in any way")),
			"user-identifier",
			http.StatusBadRequest,
			`{"error":"invalid character 'h' in literal true (expecting 'r')","status":400}`,
		},
		{
			"bad request context",
			&mockInsertDatabase{},
			nil,
			[]string{"whoops"},
			http.StatusInternalServerError,
			`{"error":"could not use user id in request context","status":500}`,
		},
		{
			"ok",
			&mockInsertDatabase{},
			bytes.NewReader([]byte(`{"account_id":"account-identifier","payload":"payload-value"}`)),
			"user-identifier",
			http.StatusOK,
			`{"ack":true}`,
		},
		{
			"database error",
			&mockInsertDatabase{err: errors.New("did not work")},
			bytes.NewReader([]byte(`{"account_id":"account-identifier","payload":"payload-value"}`)),
			"user-identifier",
			http.StatusInternalServerError,
			`{"error":"did not work","status":500}`,
		},
		{
			"account not found",
			&mockInsertDatabase{err: persistence.ErrUnknownAccount("unknown account")},
			bytes.NewReader([]byte(`{"account_id":"account-identifier","payload":"payload-value"}`)),
			"user-identifier",
			http.StatusBadRequest,
			`{"error":"unknown account","status":400}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{test.db, nil}
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			r = r.WithContext(context.WithValue(r.Context(), contextKeyCookie, test.userID))
			rt.postEvents(w, r)
			if w.Code != test.expectedStatusCode {
				t.Errorf("Expected status code %d, got %d", test.expectedStatusCode, w.Code)
			}
			if strings.Index(w.Body.String(), test.expectedResponse) == -1 {
				t.Errorf("Unexpected response body %s", w.Body.String())
			}
		})
	}
}

type mockQueryDatabase struct {
	persistence.Database
	payload string
	err     error
}

func (m *mockQueryDatabase) Query(q persistence.Query) (map[string][]persistence.EventResult, error) {
	out := map[string][]persistence.EventResult{}
	eventID := "event-id"
	if q.Since() != "" {
		eventID = q.Since()
	}
	for _, id := range q.AccountIDs() {
		out[id] = append(out[id], persistence.EventResult{
			UserID:  q.UserID(),
			Payload: m.payload,
			EventID: eventID,
		})
	}
	return out, m.err
}
func TestRouter_GetEvents(t *testing.T) {
	tests := []struct {
		name               string
		db                 persistence.Database
		queryString        string
		userID             interface{}
		expectedStatusCode int
		expectedResponse   string
	}{
		{
			"bad request context",
			&mockQueryDatabase{},
			"",
			[]string{"whoops"},
			http.StatusInternalServerError,
			`{"error":"could not use user id in request context","status":500}`,
		},
		{
			"database error",
			&mockQueryDatabase{err: errors.New("did not work")},
			"",
			"user-identifier",
			http.StatusInternalServerError,
			`{"error":"did not work","status":500}`,
		},
		{
			"no params",
			&mockQueryDatabase{payload: "payload-value"},
			"",
			"user-identifier",
			http.StatusOK,
			`{"events":{}}`,
		},
		{
			"query params",
			&mockQueryDatabase{payload: "payload-value"},
			"?account_id=account-identifier&account_id=other-identifier",
			"user-identifier",
			http.StatusOK,
			`{"events":{"account-identifier":[{"user_id":"user-identifier","event_id":"event-id","payload":"payload-value"}],"other-identifier":[{"user_id":"user-identifier","event_id":"event-id","payload":"payload-value"}]}}`,
		},
		{
			"since param",
			&mockQueryDatabase{payload: "payload-value"},
			"?account_id=account-identifier&since=since-value",
			"user-identifier",
			http.StatusOK,
			`{"events":{"account-identifier":[{"user_id":"user-identifier","event_id":"since-value","payload":"payload-value"}]}}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{test.db, nil}
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/%s", test.queryString), nil)
			r = r.WithContext(context.WithValue(r.Context(), contextKeyCookie, test.userID))
			rt.getEvents(w, r)
			if w.Code != test.expectedStatusCode {
				t.Errorf("Expected status code %d, got %d", test.expectedStatusCode, w.Code)
			}
			if strings.Index(w.Body.String(), test.expectedResponse) == -1 {
				t.Errorf("Unexpected response body %s", w.Body.String())
			}
		})
	}
}
