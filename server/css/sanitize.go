// Copyright 2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package css

import (
	"errors"
	"fmt"
	"regexp"

	"github.com/aymerick/douceur/css"
	"github.com/aymerick/douceur/parser"
)

var allowedFontSizeRe = regexp.MustCompile("^(1[2-9]|[2-9][0-9])px$")
var blockedValuePatternsRe = regexp.MustCompile("(url|expression|javascript|calc|transform|-)")
var errNotAllowed = errors.New("css: rule not allowed")

const (
	bannerRootSelector = ".banner__root"
)

type cssValidator func([]string, string, string) error

var cssBlocklist map[*regexp.Regexp]cssValidator = map[*regexp.Regexp]cssValidator{
	// Use of these properties is blocked entirely
	regexp.MustCompile("(opacity|content|filter|behavior|width|cursor|pointer-events)$"): func([]string, string, string) error {
		return errNotAllowed
	},
	// Use of some blocked values is forbidden for all properties
	nil: func(_ []string, _ string, value string) error {
		if blockedValuePatternsRe.MatchString(value) {
			return errNotAllowed
		}
		return nil
	},
	// Use of font-size is only allowed on the root element. In addition to that
	// only numeric values between 12px and 99px are allowed
	regexp.MustCompile("font-size$"): func(selectors []string, _ string, value string) error {
		if allowedFontSizeRe.MatchString(value) && selectors[0] == bannerRootSelector && len(selectors) == 1 {
			return nil
		}
		return errNotAllowed
	},
	// Usage of display: none is not allowed for all selectors
	regexp.MustCompile("display$"): func(_ []string, _ string, value string) error {
		if value == "none" {
			return errNotAllowed
		}
		return nil
	},
}

func validateDeclaration(declaration *css.Declaration, selectors []string) error {
	for propertyRe, validate := range cssBlocklist {
		if propertyRe != nil && !propertyRe.MatchString(declaration.Property) {
			continue
		}
		if err := validate(selectors, declaration.Property, declaration.Value); err == nil {
			continue
		}
		return fmt.Errorf(
			"css: value %s not allowed for property %s and selectors %s",
			declaration.Value,
			declaration.Property,
			selectors,
		)
	}
	return nil
}

func validateRule(rule *css.Rule) error {
	switch rule.Kind {
	case css.QualifiedRule:
		for _, declaration := range rule.Declarations {
			if err := validateDeclaration(declaration, rule.Selectors); err != nil {
				return err
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
