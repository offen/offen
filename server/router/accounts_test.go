// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/securecookie"
	"github.com/microcosm-cc/bluemonday"
	"github.com/offen/offen/server/persistence"
)

type mockGetAccountDatabase struct {
	persistence.Service
	result persistence.AccountResult
	err    error
}

func (m *mockGetAccountDatabase) GetAccount(string, bool, string) (persistence.AccountResult, error) {
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
			&mockGetAccountDatabase{
				result: persistence.AccountResult{},
			},
			http.StatusOK,
			`{"accountId":"","name":"","created":"0001-01-01T00:00:00Z"}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			cookieSigner := securecookie.New([]byte("abc123"), nil)
			auth, _ := cookieSigner.Encode("auth", test.accountID)
			rt := router{db: test.database, authenticationSigner: cookieSigner}
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

type mockDeleteAccountDatabase struct {
	persistence.Service
	result error
}

func (m *mockDeleteAccountDatabase) RetireAccount(string) error {
	return m.result
}

func TestRouter_DeleteAccount(t *testing.T) {
	tests := []struct {
		name               string
		accountID          string
		database           persistence.Service
		user               persistence.LoginResult
		expectedStatusCode int
	}{
		{
			"not authorized",
			"account-a",
			&mockDeleteAccountDatabase{},
			persistence.LoginResult{
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a"},
				},
			},
			http.StatusForbidden,
		},
		{
			"account out of scope",
			"account-b",
			&mockDeleteAccountDatabase{},
			persistence.LoginResult{
				AdminLevel: persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a"},
				},
			},
			http.StatusForbidden,
		},
		{
			"ok",
			"account-a",
			&mockDeleteAccountDatabase{},
			persistence.LoginResult{
				AdminLevel: persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a"},
				},
			},
			http.StatusNoContent,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			cookieSigner := securecookie.New([]byte("abc123"), nil)
			auth, _ := cookieSigner.Encode("auth", test.accountID)
			rt := router{db: test.database, authenticationSigner: cookieSigner}
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/%s", test.accountID), nil)
			m := gin.New()
			m.DELETE("/:accountID", func(c *gin.Context) {
				c.Set(
					contextKeyAuth,
					test.user,
				)
				c.Next()

			}, rt.deleteAccount)
			r.AddCookie(&http.Cookie{
				Value: auth,
				Name:  "auth",
			})
			m.ServeHTTP(w, r)
			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
		})
	}
}

type mockPostAccountDatabase struct {
	persistence.Service
	loginResult      persistence.LoginResult
	loginErr         error
	createAccountErr error
}

func (m *mockPostAccountDatabase) Login(string, string) (persistence.LoginResult, error) {
	return m.loginResult, m.loginErr
}

func (m *mockPostAccountDatabase) CreateAccount(string, string, string) error {
	return m.createAccountErr
}

func TestRouter_postAccount(t *testing.T) {
	tests := []struct {
		name               string
		db                 mockPostAccountDatabase
		userContext        interface{}
		body               io.Reader
		expectedStatusCode int
	}{
		{
			"bad user context",
			mockPostAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-a",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				},
			},
			40,
			strings.NewReader(`{"accountName":"new","emailAddress":"hioffen@posteo.de","password":"pass"}`),
			http.StatusUnauthorized,
		},
		{
			"bad payload",
			mockPostAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-a",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-a",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
			},
			strings.NewReader(`"}##`),
			http.StatusBadRequest,
		},
		{
			"login error",
			mockPostAccountDatabase{
				loginErr: errors.New("did not work"),
			},
			persistence.LoginResult{
				AccountUserID: "account-a",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
			},
			strings.NewReader(`{"accountName":"new","emailAddress":"hioffen@posteo.de","password":"pass"}`),
			http.StatusUnauthorized,
		},
		{
			"account user mismatch",
			mockPostAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-a",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-b",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
			},
			strings.NewReader(`{"accountName":"new","emailAddress":"hioffen@posteo.de","password":"pass"}`),
			http.StatusBadRequest,
		},
		{
			"account user is missing permissions",
			mockPostAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-a",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-a",
			},
			strings.NewReader(`{"accountName":"new","emailAddress":"hioffen@posteo.de","password":"pass"}`),
			http.StatusForbidden,
		},
		{
			"database error",
			mockPostAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-a",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				},
				createAccountErr: errors.New("did not work"),
			},
			persistence.LoginResult{
				AccountUserID: "account-a",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
			},
			strings.NewReader(`{"accountName":"new","emailAddress":"hioffen@posteo.de","password":"pass"}`),
			http.StatusInternalServerError,
		},
		{
			"ok",
			mockPostAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-a",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-a",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
			},
			strings.NewReader(`{"accountName":"new","emailAddress":"hioffen@posteo.de","password":"pass"}`),
			http.StatusCreated,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{
				db:        &test.db,
				sanitizer: bluemonday.StrictPolicy(),
			}

			m := gin.New()
			m.POST("/", func(c *gin.Context) {
				c.Set(contextKeyAuth, test.userContext)
			}, rt.postAccount)

			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			w := httptest.NewRecorder()
			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
		})
	}
}
