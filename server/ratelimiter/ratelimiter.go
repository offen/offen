// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package ratelimiter

import (
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"fmt"
	"time"
)

var (
	errInvalidCache        = errors.New("ratelimiter: invalid value in cache")
	errWouldExceedDeadline = errors.New("ratelimiter: applicable rate limit would exceed give deadline")
)

// GetSetter needs to be implemented by any cache that is
// to be used for storing limits
type GetSetter interface {
	Get(key string) (interface{}, bool)
	Set(key string, value interface{}, expiry time.Duration)
}

// Limiter can be used to rate limit operations
// based on an identifier and a threshold value
type Limiter struct {
	timeout time.Duration
	cache   GetSetter
	salt    []byte
}

// Result describes the outcome of a `Throttle` call
type Result struct {
	Error error
	Delay time.Duration
}

func (l *Limiter) hash(s string) string {
	joined := append([]byte(s), l.salt...)
	return fmt.Sprintf("%x", sha256.Sum256(joined))
}

type cacheItem struct {
	blockUntil time.Time
	queueLen   int64
}

// LinearThrottle returns a channel that blocks until the configured
// rate limit has been satisfied. The channel will send a `Result` exactly
// once before closing, containing information on the
// applied rate limiting or possible errors that occured
func (l *Limiter) LinearThrottle(threshold time.Duration, identifier string) <-chan Result {
	return l.throttle(threshold, identifier, false)
}

// ExponentialThrottle throttles using exponentially increasing thresholds
func (l *Limiter) ExponentialThrottle(threshold time.Duration, identifier string) <-chan Result {
	return l.throttle(threshold, identifier, true)
}

func (l *Limiter) throttle(threshold time.Duration, identifier string, exponential bool) <-chan Result {
	hashedIdentifier := l.hash(identifier)

	out := make(chan Result)
	go func() {
		if value, found := l.cache.Get(hashedIdentifier); found {
			if item, ok := value.(cacheItem); ok {
				remaining := time.Until(item.blockUntil)
				if remaining > l.timeout {
					out <- Result{Error: errWouldExceedDeadline}
					return
				}

				factor := time.Duration(1)
				if exponential {
					factor = time.Duration(item.queueLen)
				}

				l.cache.Set(
					hashedIdentifier,
					cacheItem{
						blockUntil: item.blockUntil.Add(
							threshold * factor,
						),
						queueLen: item.queueLen + 1,
					},
					remaining,
				)
				time.Sleep(remaining)
				out <- Result{Delay: remaining}
			} else {
				out <- Result{Error: errInvalidCache}
			}
		} else {
			l.cache.Set(hashedIdentifier, cacheItem{
				blockUntil: time.Now().Add(threshold),
				queueLen:   1,
			}, threshold)
			out <- Result{}
		}
		close(out)
	}()
	return out
}

// New creates a new Throttler using Limiter. `threshold` defines the
// enforced minimum distance between two calls of the
// instance's `Throttle` method using the same identifier
func New(timeout time.Duration, cache GetSetter) *Limiter {
	salt, err := randomBytes(16)
	if err != nil {
		panic("cannot initialize rate limiter")
	}
	return &Limiter{
		cache:   cache,
		timeout: timeout,
		salt:    salt,
	}
}

func randomBytes(size int) ([]byte, error) {
	b := make([]byte, size)
	_, err := rand.Read(b)
	if err != nil {
		return nil, fmt.Errorf("ratelimiter: error reading random bytes: %w", err)
	}
	return b, nil
}
