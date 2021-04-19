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
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/persistence"
)

type mockAccountsDatabase struct {
	persistence.Service
	result persistence.AccountResult
	err    error
}

func (m *mockAccountsDatabase) GetAccount(accountID string, styles, events bool, eventsSince string) (persistence.AccountResult, error) {
	return m.result, m.err
}

func TestRouter_GetPublicKey(t *testing.T) {
	tests := []struct {
		name               string
		db                 persistence.Service
		queryString        string
		expectedStatusCode int
	}{
		{
			"database error",
			&mockAccountsDatabase{
				err: errors.New("did not work"),
			},
			"accountId=12345",
			http.StatusInternalServerError,
		},
		{
			"account not found",
			&mockAccountsDatabase{
				err: persistence.ErrUnknownAccount("unknown account"),
			},
			"accountId=12345",
			http.StatusBadRequest,
		},
		{
			"default",
			&mockAccountsDatabase{
				result: persistence.AccountResult{
					AccountID: "12345",
					PublicKey: nil,
				},
			},
			"accountId=12345",
			http.StatusOK,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{db: test.db, config: &config.Config{}}
			m := gin.New()
			m.GET("/", rt.getPublicKey)
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/?%s", test.queryString), nil)
			m.ServeHTTP(w, r)
			if w.Code != test.expectedStatusCode {
				t.Errorf("Expected status code %d, got %d", test.expectedStatusCode, w.Code)
			}
		})
	}
}

type mockUserSecretDatabase struct {
	persistence.Service
	err error
}

func (m *mockUserSecretDatabase) AssociateUserSecret(string, string, string) error {
	return m.err
}

func TestRouter_PostUserSecret(t *testing.T) {
	tests := []struct {
		name           string
		db             persistence.Service
		body           io.Reader
		cookie         *http.Cookie
		expectedStatus int
		expectedUserID func(string) bool
	}{
		{
			"bad payload",
			&mockUserSecretDatabase{},
			strings.NewReader("this is not json"),
			&http.Cookie{},
			http.StatusBadRequest,
			func(string) bool { return true },
		},
		{
			"db error",
			&mockUserSecretDatabase{
				err: errors.New("did not work"),
			},
			strings.NewReader(`
			{
				"encrypted_user_secret": "a value",
				"accountId": "another value"
			}
			`),
			&http.Cookie{},
			http.StatusBadRequest,
			func(input string) bool { return input != "" },
		},
		{
			"new user id",
			&mockUserSecretDatabase{},
			strings.NewReader(`
			{
				"encrypted_user_secret": "a value",
				"accountId": "another value"
			}
			`),
			&http.Cookie{},
			http.StatusNoContent,
			func(input string) bool { return input != "" },
		},
		{
			"existing user id",
			&mockUserSecretDatabase{},
			strings.NewReader(`
			{
				"encrypted_user_secret": "a value",
				"accountId": "another value"
			}
			`),
			&http.Cookie{
				Name:  cookieKey,
				Value: "existing-user-id",
			},
			http.StatusNoContent,
			func(input string) bool { return input == "existing-user-id" },
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{db: test.db, config: &config.Config{}}
			m := gin.New()
			m.POST("/", rt.postUserSecret)
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			r.AddCookie(test.cookie)
			m.ServeHTTP(w, r)
			if w.Code != test.expectedStatus {
				t.Errorf("Expected status code %d, got %d", test.expectedStatus, w.Code)
			}
			cookies := w.Result().Cookies()
			for _, cookie := range cookies {
				if cookie.Name == cookieKey {
					if !test.expectedUserID(cookie.Value) {
						t.Errorf("Unexpected cookie value %s", cookie.Value)
					}
				}
			}
		})
	}
}
