package router

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/offen/offen/server/persistence"
)

type mockAccountDatabase struct {
	persistence.Database
	result persistence.AccountResult
	err    error
}

func (m *mockAccountDatabase) GetAccount(string, bool, string) (persistence.AccountResult, error) {
	return m.result, m.err
}

func TestRouter_GetAccount(t *testing.T) {
	tests := []struct {
		name               string
		query              string
		database           persistence.Database
		expectedStatusCode int
		expectedBody       string
	}{
		{
			"no account id",
			"since=1234",
			&mockAccountDatabase{},
			http.StatusBadRequest,
			`{"error":"no accountId parameter given","status":400}`,
		},
		{
			"persistence error",
			"accountId=account-a",
			&mockAccountDatabase{
				err: errors.New("did not work"),
			},
			http.StatusInternalServerError,
			`{"error":"did not work","status":500}`,
		},
		{
			"unknown account",
			"accountId=account-z",
			&mockAccountDatabase{
				err: persistence.ErrUnknownAccount("unknown account z"),
			},
			http.StatusNotFound,
			`{"error":"account account-z not found","status":404}`,
		},
		{
			"bad result",
			"accountId=account-a",
			&mockAccountDatabase{
				result: persistence.AccountResult{
					PublicKey: func() string {
						return "haha, whoops"
					},
				},
			},
			http.StatusInternalServerError,
			`{"error":"json: unsupported type: func() string","status":500}`,
		},
		{
			"ok",
			"accountId=account-a",
			&mockAccountDatabase{
				result: persistence.AccountResult{},
			},
			http.StatusOK,
			`{"accountId":""}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{db: test.database}
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/?%s", test.query), nil)
			rt.getAccount(w, r)
			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
			if !strings.Contains(w.Body.String(), test.expectedBody) {
				t.Errorf("Unexpected response body %s", w.Body.String())
			}
		})
	}
}
