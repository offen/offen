package router

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/persistence"
)

type mockAccountDatabase struct {
	persistence.Service
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
		database           persistence.Service
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
			r := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/%s", test.accountID), nil)
			m := gin.New()
			m.GET("/:accountID", func(c *gin.Context) {
				c.Set(

					contextKeyAuth,
					persistence.LoginResult{
						Accounts: []persistence.LoginAccountResult{
							{AccountID: "account-a"},
						},
					},
				)
				c.Next()

			}, rt.getAccount)
			r.AddCookie(&http.Cookie{
				Value: auth,
				Name:  "auth",
			})
			m.ServeHTTP(w, r)
			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
			if !strings.Contains(w.Body.String(), test.expectedBody) {
				t.Errorf("Unexpected response body %s", w.Body.String())
			}
		})
	}
}
