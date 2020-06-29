// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package ratelimiter

import (
	"fmt"
	"sync"
	"testing"
	"time"
)

type mockGetSetter struct {
	values map[string]value
	lock   sync.Mutex
}

type value struct {
	value  interface{}
	expiry time.Time
}

func (m *mockGetSetter) Get(key string) (interface{}, bool) {
	m.lock.Lock()
	defer m.lock.Unlock()
	v, ok := m.values[key]
	if !ok {
		return nil, false
	}
	if time.Now().After(v.expiry) {
		delete(m.values, key)
		return nil, false
	}
	return v.value, true
}

func (m *mockGetSetter) Set(key string, v interface{}, expiry time.Duration) {
	m.lock.Lock()
	defer m.lock.Unlock()
	if m.values == nil {
		m.values = map[string]value{}
	}
	m.values[key] = value{v, time.Now().Add(expiry)}
}

func TestLinearThrottle(t *testing.T) {
	tests := []struct {
		name               string
		sleep              time.Duration
		threshold          time.Duration
		expectedThrottling bool
	}{
		{
			"default",
			time.Second,
			time.Millisecond,
			false,
		},
		{
			"hit",
			time.Millisecond,
			time.Second,
			true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			limiter := New(time.Hour, &mockGetSetter{})
			<-limiter.LinearThrottle(test.threshold, test.name)
			time.Sleep(test.sleep)
			result := <-limiter.LinearThrottle(test.threshold, test.name)
			if result.Delay > 0 != test.expectedThrottling {
				t.Errorf("Expected %v, got %v", test.expectedThrottling, result.Delay)
			}
		})
	}
}

func ExampleNew() {
	limiter := New(time.Hour, &mockGetSetter{})

	r1 := <-limiter.LinearThrottle(time.Second*2, "example")
	fmt.Println(r1.Delay > 0)

	time.Sleep(time.Second * 3)
	r2 := <-limiter.LinearThrottle(time.Second*2, "example")
	fmt.Println(r2.Delay > 0)

	time.Sleep(time.Second)
	r3 := <-limiter.LinearThrottle(time.Second*2, "example")
	other := <-limiter.LinearThrottle(time.Second*2, "other")
	fmt.Println(r3.Delay > 0)
	fmt.Println(other.Delay > 0)

	// Output:
	// false
	// false
	// true
	// false
}
