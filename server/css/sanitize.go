// Copyright 2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package css

import (
	"fmt"
	"regexp"

	"github.com/aymerick/douceur/css"
	"github.com/aymerick/douceur/parser"
)

var allowedFontSizeRe = regexp.MustCompile("^[1-9][2-9]px$")
var blockedURLPatternsRe = regexp.MustCompile("(url|expression|javascript)")

var cssBlocklist map[*regexp.Regexp]func(string, []string) bool = map[*regexp.Regexp]func(string, []string) bool{
	regexp.MustCompile("opacity$"):  func(string, []string) bool { return true },
	regexp.MustCompile("content$"):  func(string, []string) bool { return true },
	regexp.MustCompile("filter$"):   func(string, []string) bool { return true },
	regexp.MustCompile("behavior$"): func(string, []string) bool { return true },
	regexp.MustCompile("width$"):    func(string, []string) bool { return true },
	regexp.MustCompile("font-size$"): func(v string, s []string) bool {
		if allowedFontSizeRe.MatchString(v) && s[0] == ".banner__host" && len(s) == 1 {
			return false
		}
		return true
	},
	regexp.MustCompile("display$"): func(v string, _ []string) bool {
		return v == "none"
	},
	regexp.MustCompile(".*"): func(v string, _ []string) bool {
		return blockedURLPatternsRe.MatchString(v)
	},
}

func validateRule(rule *css.Rule) error {
	switch rule.Kind {
	case css.QualifiedRule:
		for _, declaration := range rule.Declarations {
			for propertyRe, blockDeclaration := range cssBlocklist {
				if propertyRe.MatchString(declaration.Property) && blockDeclaration(declaration.Value, rule.Selectors) {
					return fmt.Errorf("css: value %s not allowed for property %s", declaration.Value, declaration.Property)
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
