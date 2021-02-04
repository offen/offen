// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/microcosm-cc/bluemonday"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/persistence"
)

type mockGetSetupDatabase struct {
	persistence.Service
	result bool
}

func (m *mockGetSetupDatabase) ProbeEmpty() bool {
	return m.result
}

func TestRouter_getSetup(t *testing.T) {
	t.Run("empty", func(t *testing.T) {
		rt := router{
			config: &config.Config{},
			db:     &mockGetSetupDatabase{result: true},
		}

		m := gin.New()
		m.GET("/", rt.getSetup)
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		m.ServeHTTP(w, r)

		if w.Code != http.StatusNoContent {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})
	t.Run("not empty", func(t *testing.T) {
		rt := router{
			config: &config.Config{},
			db:     &mockGetSetupDatabase{result: false},
		}

		m := gin.New()
		m.GET("/", rt.getSetup)
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		m.ServeHTTP(w, r)

		if w.Code != http.StatusForbidden {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})
}

type mockPostSetupDatabase struct {
	persistence.Service
	err error
}

func (m *mockPostSetupDatabase) Bootstrap(persistence.BootstrapConfig) chan persistence.BootstrapProgress {
	out := make(chan persistence.BootstrapProgress)
	go func() {
		out <- persistence.BootstrapProgress{
			Err: m.err,
		}
		close(out)
	}()
	return out
}

func TestRouter_postSetup(t *testing.T) {
	tests := []struct {
		name               string
		body               io.Reader
		db                 mockPostSetupDatabase
		expectedStatusCode int
	}{
		{
			"bad payload",
			strings.NewReader("mmm617"),
			mockPostSetupDatabase{},
			http.StatusBadRequest,
		},
		{
			"db error",
			strings.NewReader(`{"accountName":"name","emailAddress":"hioffen@posteo.de","password":"secret"}`),
			mockPostSetupDatabase{
				err: errors.New("did not work"),
			},
			http.StatusInternalServerError,
		},
		{
			"ok",
			strings.NewReader(`{"accountName":"name","emailAddress":"hioffen@posteo.de","password":"secret"}`),
			mockPostSetupDatabase{},
			http.StatusNoContent,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{
				config:    &config.Config{},
				db:        &test.db,
				sanitizer: bluemonday.StrictPolicy(),
			}

			m := gin.New()
			m.POST("/", rt.postSetup)
			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			w := httptest.NewRecorder()
			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
		})
	}
}
