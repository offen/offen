// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/persistence"
)

func strptr(s string) *string {
	return &s
}

type mockPurgeEventsService struct {
	persistence.Service
	err error
}

func (m *mockPurgeEventsService) Purge(string) error {
	return m.err
}

func TestRouter_purgeEvents(t *testing.T) {
	tests := []struct {
		name           string
		db             persistence.Service
		expectedStatus int
	}{
		{
			"not ok",
			&mockPurgeEventsService{
				err: errors.New("did not work"),
			},
			http.StatusInternalServerError,
		},
		{
			"ok",
			&mockPurgeEventsService{},
			http.StatusNoContent,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			m := gin.New()
			rt := router{
				db: test.db,
			}
			m.POST("/", func(c *gin.Context) {
				c.Set(contextKeyCookie, "user-id")
				c.Next()
			}, rt.purgeEvents)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, "/", nil)

			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatus {
				t.Errorf("Expected status code %d, got %d", test.expectedStatus, w.Code)
			}
		})
	}
}

type mockGetEventsService struct {
	persistence.Service
	result map[string][]persistence.EventResult
	err    error
}

func (m *mockGetEventsService) Query(persistence.Query) (map[string][]persistence.EventResult, error) {
	return m.result, m.err
}

func TestRouter_getEvents(t *testing.T) {
	tests := []struct {
		name           string
		db             persistence.Service
		expectedStatus int
		expectedBody   string
	}{
		{
			"database error",
			&mockGetEventsService{
				err: errors.New("did not work"),
			},
			http.StatusInternalServerError,
			"",
		},
		{
			"StatusOK",
			&mockGetEventsService{
				result: map[string][]persistence.EventResult{
					"account-a": []persistence.EventResult{
						{AccountID: "account-a", SecretID: strptr("hashed-user-a"), EventID: "event-a", Payload: "payload"},
					},
				},
			},
			http.StatusOK,
			`{"events":{"account-a":[{"accountId":"account-a","secretId":"hashed-user-a","eventId":"event-a","payload":"payload"}]}}`,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			m := gin.New()
			rt := router{
				db: test.db,
			}
			m.GET("/", func(c *gin.Context) {
				c.Set(contextKeyCookie, "user-id")
				c.Next()
			}, rt.getEvents)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, "/", nil)

			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatus {
				t.Errorf("Expected status code %d, got %d", test.expectedStatus, w.Code)
			}

			if test.expectedBody != "" {
				if !strings.Contains(w.Body.String(), test.expectedBody) {
					t.Errorf("Expected response body %s to contain %s", w.Body.String(), test.expectedBody)
				}
			}
		})
	}
}

type mockPostEventsService struct {
	persistence.Service
	err error
}

func (m *mockPostEventsService) Insert(string, string, string, *string) error {
	return m.err
}

func TestRouter_postEvents(t *testing.T) {
	tests := []struct {
		name           string
		db             persistence.Service
		body           string
		expectedStatus int
		expectedBody   string
	}{
		{
			"bad payload",
			&mockPostEventsService{},
			"o hai!",
			http.StatusBadRequest,
			"",
		},
		{
			"database error",
			&mockPostEventsService{
				err: errors.New("did not work"),
			},
			`{"accountId":"account-a","payload":"some-payload"}`,
			http.StatusInternalServerError,
			"",
		},
		{
			"unknown account",
			&mockPostEventsService{
				err: persistence.ErrUnknownAccount("unknown account"),
			},
			`{"accountId":"account-a","payload":"some-payload"}`,
			http.StatusNotFound,
			"",
		},
		{
			"unknown user",
			&mockPostEventsService{
				err: persistence.ErrUnknownSecret("unknown secret"),
			},
			`{"accountId":"account-a","payload":"some-payload"}`,
			http.StatusBadRequest,
			"",
		},
		{
			"ok",
			&mockPostEventsService{},
			`{"accountId":"account-a","payload":"some-payload"}`,
			http.StatusCreated,
			`{"ack":true}`,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			m := gin.New()
			rt := router{
				db:     test.db,
				config: &config.Config{},
			}
			m.POST("/", func(c *gin.Context) {
				c.Set(contextKeyCookie, "user-id")
				c.Set(contextKeySecureContext, false)
				c.Next()
			}, rt.postEvents)

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(test.body))

			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatus {
				t.Errorf("Expected status code %d, got %d", test.expectedStatus, w.Code)
			}

			if test.expectedBody != "" {
				if !strings.Contains(w.Body.String(), test.expectedBody) {
					t.Errorf("Expected response body %s to contain %s", w.Body.String(), test.expectedBody)
				}
			}
		})
	}
}
