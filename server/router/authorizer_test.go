package router

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetAuthorizer(t *testing.T) {
	tests := []struct {
		name        string
		request     *http.Request
		claims      map[string]interface{}
		expectError bool
	}{
		{
			"no account requested",
			httptest.NewRequest(http.MethodGet, "/foo/bar", nil),
			nil,
			false,
		},
		{
			"bad claims",
			httptest.NewRequest(http.MethodGet, "/?accountId=something-something", nil),
			map[string]interface{}{"accounts": func() string { return "howsup?" }},
			true,
		},
		{
			"account not in claims",
			httptest.NewRequest(http.MethodGet, "/?accountId=something-something", nil),
			map[string]interface{}{"accounts": []interface{}{"other-other"}},
			true,
		},
		{
			"ok",
			httptest.NewRequest(http.MethodGet, "/?accountId=something-something", nil),
			map[string]interface{}{"accounts": []interface{}{"other-other", "something-something"}},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := getAuthorizer(test.request, test.claims)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}

func TestPostAuthorizer(t *testing.T) {
	tests := []struct {
		name        string
		request     *http.Request
		claims      map[string]interface{}
		expectError bool
	}{
		{
			"nil claims",
			httptest.NewRequest(http.MethodPost, "/", nil),
			nil,
			true,
		},
		{
			"bad claim shape",
			httptest.NewRequest(http.MethodPost, "/", nil),
			map[string]interface{}{
				"nilly": "willy",
			},
			true,
		},
		{
			"bad claim value",
			httptest.NewRequest(http.MethodPost, "/", nil),
			map[string]interface{}{
				"rpc": 1,
			},
			true,
		},
		{
			"ok",
			httptest.NewRequest(http.MethodPost, "/", nil),
			map[string]interface{}{
				"rpc": "1",
			},
			false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := postAuthorizer(test.request, test.claims)
			if (err != nil) != test.expectError {
				t.Errorf("Unexpected error value %v", err)
			}
		})
	}
}
