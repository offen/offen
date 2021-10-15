// Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/persistence"
)

type inboundEventPayload struct {
	AccountID string `json:"accountId"`
	Payload   string `json:"payload"`
}

type ackResponse struct {
	Ack bool `json:"ack"`
}

var errBadRequestContext = errors.New("could not use user id in request context")

func (rt *router) postEvents(c *gin.Context) {
	userID := c.GetString(contextKeyCookie)
	if l := <-rt.getLimiter().LinearThrottle(time.Second/2, fmt.Sprintf("postEvents-%s", userID)); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error rate limiting request: %w", l.Error),
			http.StatusTooManyRequests,
		).Pipe(c)
		return
	}

	evt := inboundEventPayload{}
	if err := c.BindJSON(&evt); err != nil {
		newJSONError(
			fmt.Errorf("router: error decoding request payload: %v", err),
			http.StatusBadRequest,
		).Pipe(c)
		return
	}

	if err := rt.db.Insert(userID, evt.AccountID, evt.Payload, nil); err != nil {
		var unknownAccountErr persistence.ErrUnknownAccount
		if errors.As(err, &unknownAccountErr) {
			newJSONError(
				fmt.Errorf("router: error inserting event: %w", unknownAccountErr),
				http.StatusNotFound,
			).Pipe(c)
			return
		}

		var unknownSecretErr persistence.ErrUnknownSecret
		if errors.As(err, &unknownSecretErr) {
			newJSONError(
				fmt.Errorf("router: error inserting event: %w", unknownSecretErr),
				http.StatusBadRequest,
			).Pipe(c)
			return
		}

		newJSONError(
			fmt.Errorf("router: error persisting event: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}

	http.SetCookie(
		c.Writer,
		rt.userCookie(userID, c.GetBool(contextKeySecureContext)),
	)
	c.JSON(http.StatusCreated, ackResponse{true})
}

func (rt *router) getEvents(c *gin.Context) {
	userID := c.GetString(contextKeyCookie)
	if l := <-rt.getLimiter().LinearThrottle(time.Second, fmt.Sprintf("getEvents-%s", userID)); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error rate limiting request: %w", l.Error),
			http.StatusTooManyRequests,
		).Pipe(c)
		return
	}
	result, err := rt.db.Query(persistence.Query{
		UserID: userID,
		Since:  c.Query("since"),
	})
	if err != nil {
		newJSONError(
			fmt.Errorf("router: error performing event query: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (rt *router) deleteEvents(c *gin.Context) {
	userID := c.GetString(contextKeyCookie)
	if l := <-rt.getLimiter().LinearThrottle(time.Second, fmt.Sprintf("purgeEvents-%s", userID)); l.Error != nil {
		newJSONError(
			fmt.Errorf("router: error rate limiting request: %w", l.Error),
			http.StatusTooManyRequests,
		).Pipe(c)
		return
	}
	if err := rt.db.Purge(userID); err != nil {
		newJSONError(
			fmt.Errorf("router: error purging user events: %v", err),
			http.StatusInternalServerError,
		).Pipe(c)
		return
	}
	if c.Query("user") != "" {
		http.SetCookie(
			c.Writer,
			rt.userCookie("", c.GetBool(contextKeySecureContext)),
		)
	}
	c.Status(http.StatusNoContent)
}
