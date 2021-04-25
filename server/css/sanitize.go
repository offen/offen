// Copyright 2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package css

import (
	"fmt"
	"regexp"

	"github.com/aymerick/douceur/css"
	"github.com/aymerick/douceur/parser"
)

var allowedFontSizeRe = regexp.MustCompile("^(1[2-9]|[2-9][0-9])px$")
var blockedURLPatternsRe = regexp.MustCompile("(url|expression|javascript)")

const (
	bannerRootSelector = ".banner__root"
)

var cssBlocklist map[*regexp.Regexp]func([]string, string, string) bool = map[*regexp.Regexp]func([]string, string, string) bool{
	// Use of opacity is blocked entirely
	regexp.MustCompile("opacity$"): func([]string, string, string) bool { return true },
	// Use of content is blocked entirely
	regexp.MustCompile("content$"): func([]string, string, string) bool { return true },
	// Use of filter is blocked entirely
	regexp.MustCompile("filter$"): func([]string, string, string) bool { return true },
	// Use of behavior is blocked entirely
	regexp.MustCompile("behavior$"): func([]string, string, string) bool { return true },
	// Use of width is blocked entirely
	regexp.MustCompile("width$"): func([]string, string, string) bool { return true },
	// Use of font-size is only allowed on the root element. In addition to that
	// only numeric values between 12px and 99px are allowed
	regexp.MustCompile("font-size$"): func(selectors []string, _ string, value string) bool {
		if allowedFontSizeRe.MatchString(value) && selectors[0] == bannerRootSelector && len(selectors) == 1 {
			return false
		}
		return true
	},
	// Usage of display: none is not allowed for all selectors
	regexp.MustCompile("display$"): func(_ []string, _ string, value string) bool {
		return value == "none"
	},
	// Usage of url, expression or javascript is blocked
	regexp.MustCompile(".*"): func(_ []string, _ string, value string) bool {
		return blockedURLPatternsRe.MatchString(value)
	},
}

func validateRule(rule *css.Rule) error {
	switch rule.Kind {
	case css.QualifiedRule:
		for _, declaration := range rule.Declarations {
			for propertyRe, blockDeclaration := range cssBlocklist {
				if propertyRe.MatchString(declaration.Property) && blockDeclaration(rule.Selectors, declaration.Property, declaration.Value) {
					return fmt.Errorf("css: value %s not allowed for property %s and selectors %s", declaration.Value, declaration.Property, rule.Selectors)
				}
			}
		}
	case css.AtRule:
		for _, nestedRule := range rule.Rules {
			return validateRule(nestedRule)
		}
	}
	return nil
}

// ValidateCSS makes sure the given CSS does not contain any potentially
// dangerous rules in the context of being used in the consent banner
func ValidateCSS(input string) error {
	s, err := parser.Parse(input)
	if err != nil {
		return fmt.Errorf("css: error parsing given CSS: %w", err)
	}

	for _, rule := range s.Rules {
		if err := validateRule(rule); err != nil {
			return err
		}
	}
	return nil
}
