// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import "github.com/gin-gonic/gin"

type errorResponse struct {
	Error  string `json:"error"`
	Status int    `json:"status"`
}

func (e *errorResponse) Pipe(c *gin.Context) {
	c.AbortWithStatusJSON(e.Status, e)
}

func newJSONError(err error, status int) *errorResponse {
	return &errorResponse{
		Error:  err.Error(),
		Status: status,
	}
}
