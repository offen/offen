package router

import (
	"context"
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
	result persistence.AccountResult
	err    error
}

func (m *mockAccountDatabase) GetAccount(string, bool, string) (persistence.AccountResult, error) {
	return m.result, m.err
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
			"ok",
			"account-a",
			&mockAccountDatabase{
				result: persistence.AccountResult{},
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
			r = r.WithContext(
				context.WithValue(
					context.Background(),
					contextKeyAuth,
					persistence.LoginResult{
						Accounts: []persistence.LoginAccountResult{
							{AccountID: "account-a"},
						},
					},
				),
			)
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
