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

func TestThrottle(t *testing.T) {
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
			limiter := New(test.threshold, time.Hour, &mockGetSetter{})
			<-limiter.Throttle(test.name)
			time.Sleep(test.sleep)
			result := <-limiter.Throttle(test.name)
			if result.Delay > 0 != test.expectedThrottling {
				t.Errorf("Expected %v, got %v", test.expectedThrottling, result.Delay)
			}
		})
	}
}

func TestThrottle_BadCache(t *testing.T) {
	t.Run("bad cache", func(t *testing.T) {
		mock := &mockGetSetter{}
		limiter := New(time.Second, time.Hour, mock)
		limiter.Throttle("zalgo")
		mock.Set("zalgo", "zalgo corrupted ur cache", time.Minute)
		result := <-limiter.Throttle("zalgo")
		if result.Error == nil {
			t.Errorf("Expected error, got %v", result)
		}
		if result.Delay > 0 {
			t.Error("Expected error not to block")
		}
	})
}

func ExampleNew() {
	limiter := New(time.Second*2, time.Hour, &mockGetSetter{})

	r1 := <-limiter.Throttle("example")
	fmt.Println(r1.Delay > 0)

	time.Sleep(time.Second * 3)
	r2 := <-limiter.Throttle("example")
	fmt.Println(r2.Delay > 0)

	time.Sleep(time.Second)
	r3 := <-limiter.Throttle("example")
	other := <-limiter.Throttle("other")
	fmt.Println(r3.Delay > 0)
	fmt.Println(other.Delay > 0)

	// Output:
	// false
	// false
	// true
	// false
}
