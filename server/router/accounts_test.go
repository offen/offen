package router

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/mux"
	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/persistence"
)

type mockAccountDatabase struct {
	persistence.Database
	result      persistence.AccountResult
	loginResult persistence.LoginResult
	err         error
}

func (m *mockAccountDatabase) GetAccount(string, bool, string) (persistence.AccountResult, error) {
	return m.result, m.err
}

func (m *mockAccountDatabase) LookupUser(string) (persistence.LoginResult, error) {
	return m.loginResult, nil
}

func TestRouter_GetAccount(t *testing.T) {
	tests := []struct {
		name               string
		accountID          string
		database           persistence.Database
		expectedStatusCode int
		expectedBody       string
	}{
		{
			"persistence error",
			"account-a",
			&mockAccountDatabase{
				err: errors.New("did not work"),
				loginResult: persistence.LoginResult{
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a"},
					},
				},
			},
			http.StatusInternalServerError,
			`{"error":"did not work","status":500}`,
		},
		{
			"unknown account",
			"account-z",
			&mockAccountDatabase{
				err: persistence.ErrUnknownAccount("unknown account z"),
				loginResult: persistence.LoginResult{
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-z"},
					},
				},
			},
			http.StatusNotFound,
			`{"error":"account account-z not found","status":404}`,
		},
		{
			"bad result",
			"account-a",
			&mockAccountDatabase{
				loginResult: persistence.LoginResult{
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a"},
					},
				},
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
			"account-a",
			&mockAccountDatabase{
				result: persistence.AccountResult{},
				loginResult: persistence.LoginResult{
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a"},
					},
				},
			},
			http.StatusOK,
			`{"accountId":"","name":""}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			cookieSigner := securecookie.New([]byte("abc123"), nil)
			auth, _ := cookieSigner.Encode("auth", test.accountID)
			rt := router{db: test.database, cookieSigner: cookieSigner}
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			r = mux.SetURLVars(r, map[string]string{"accountID": test.accountID})
			r.AddCookie(&http.Cookie{
				Value: auth,
				Name:  "auth",
			})
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
