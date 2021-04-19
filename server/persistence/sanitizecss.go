// Copyright 2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package persistence

import (
	"fmt"
	"regexp"

	"github.com/aymerick/douceur/css"
	"github.com/aymerick/douceur/parser"
)

var cssAllowlist map[string]*regexp.Regexp = map[string]*regexp.Regexp{
	"color":   regexp.MustCompile(".*"),
	"padding": regexp.MustCompile(".*"),
	"margin":  regexp.MustCompile(".*"),
}

// SanitizeCSS makes sure untrusted CSS is stripped down to the allowed
// subset of styles only
func SanitizeCSS(input string) (string, error) {
	cleaned := css.NewStylesheet()
	s, err := parser.Parse(input)
	if err != nil {
		return "", fmt.Errorf("persistence: error parsing given CSS: %w", err)
	}
	for _, rule := range s.Rules {
		cleanRule := css.NewRule(rule.Kind)
		cleanRule.Selectors = append(cleanRule.Selectors, rule.Selectors...)

		allowsAny := false
		for _, declaration := range rule.Declarations {
			if re, ok := cssAllowlist[declaration.Property]; ok {
				if re.MatchString(declaration.String()) {
					cleanRule.Declarations = append(cleanRule.Declarations, declaration)
					allowsAny = true
				}
			}
		}

		if allowsAny {
			cleaned.Rules = append(cleaned.Rules, cleanRule)
		}
	}
	return cleaned.String(), nil
}
