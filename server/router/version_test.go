// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRouter_getVersion(t *testing.T) {
	rt := router{}
	m := gin.New()
	m.GET("/", rt.getVersion)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)

	m.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Errorf("Unexpected status code %v", w.Code)
	}
}
