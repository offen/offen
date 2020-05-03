// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package public

import (
	"bytes"
	"fmt"
	"html/template"
	"io/ioutil"
	"strings"
	"testing"
)

func TestLocalizedFS_Open(t *testing.T) {
	tests := []struct {
		name            string
		locale          string
		lookup          string
		expectError     bool
		expectedContent string
	}{
		{
			"no match",
			"en",
			"/foo/bar/baz.txt",
			true,
			"",
		},
		{
			"exact match",
			"fr",
			"/file.txt",
			false,
			"Francais",
		},
		{
			"default match",
			"en",
			"/file.txt",
			false,
			"English",
		},
		{
			"root match",
			"fr",
			"/thing.txt",
			false,
			"XYZ",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			l := &LocalizedFS{
				locale: test.locale,
				root:   newStatikFS("./testdata"),
			}
			result, err := l.Open(test.lookup)
			if test.expectError != (err != nil) {
				t.Errorf("Unexpected error value %v", err)
			}
			if test.expectedContent != "" {
				s, _ := ioutil.ReadAll(result)
				if !strings.Contains(string(s), test.expectedContent) {
					t.Errorf("Expected '%v', got content '%v'", test.expectedContent, string(s))
				}
			}
		})
	}
}

func TestLocalizedFS_rev(t *testing.T) {
	tests := []struct {
		name     string
		locale   string
		lookup   string
		expected string
	}{
		{
			"no manifest",
			"en",
			"/file.txt",
			"/file.txt",
		},
		{
			"match",
			"fr",
			"/truc.txt",
			"/truc-abc123.txt",
		},
		{
			"no match",
			"fr",
			"/file.txt",
			"/file.txt",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			l := &LocalizedFS{
				locale: test.locale,
				root:   newStatikFS("./testdata"),
			}
			result := l.rev(test.lookup)
			if test.expected != result {
				t.Errorf("Expected %v, got %v", test.expected, result)
			}
		})
	}
}

func TestLocalizedFS_getTemplate(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		l := &LocalizedFS{
			locale: "en",
			root:   newStatikFS("./testdata"),
		}
		tpl, err := l.getTemplate("test", []string{"/template.go.html"}, template.FuncMap{
			"greet": func(s string) string {
				return fmt.Sprintf("Hello %s", s)
			},
		})
		if err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		buf := bytes.NewBuffer(nil)
		if err := tpl.ExecuteTemplate(buf, "test", map[string]string{
			"name": "Goofy",
		}); err != nil {
			t.Errorf("Unexpected error %v", err)
		}
		if !strings.Contains(buf.String(), "Hello Goofy") {
			t.Errorf("Unexpected result %v", buf.String())
		}
	})
	t.Run("unknown template files", func(t *testing.T) {
		l := &LocalizedFS{
			locale: "en",
			root:   newStatikFS("./testdata"),
		}
		_, err := l.getTemplate("test", []string{"/template.go.html", "/doesnotexist.go.html"}, template.FuncMap{
			"greet": func(s string) string {
				return fmt.Sprintf("Hello %s", s)
			},
		})
		if err == nil {
			t.Errorf("Unexpected error %v", err)
		}
	})
}
