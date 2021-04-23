// Copyright 2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package css

import (
	"fmt"
	"regexp"

	"github.com/aymerick/douceur/css"
	"github.com/aymerick/douceur/parser"
)

var cssBlocklist map[*regexp.Regexp]*regexp.Regexp = map[*regexp.Regexp]*regexp.Regexp{
	regexp.MustCompile("opacity$"):  regexp.MustCompile(".*"),
	regexp.MustCompile("content$"):  regexp.MustCompile(".*"),
	regexp.MustCompile("filter$"):   regexp.MustCompile(".*"),
	regexp.MustCompile("behavior$"): regexp.MustCompile(".*"),
	regexp.MustCompile(".*"):        regexp.MustCompile("(url|expression|javascript)"),
}

func validateRule(rule *css.Rule) error {
	switch rule.Kind {
	case css.QualifiedRule:
		for _, declaration := range rule.Declarations {
			for propertyRe, declarationRe := range cssBlocklist {
				if propertyRe.MatchString(declaration.Property) && declarationRe.MatchString(declaration.Value) {
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
