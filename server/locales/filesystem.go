// Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package locales

import (
	"fmt"
	"html/template"
	"io/ioutil"

	"github.com/leonelquinteros/gotext"
	"github.com/offen/offen/server/public"
)

const defaultLocale = "en"

func wrapFmt(f func(string, ...interface{}) string) func(string, ...interface{}) template.HTML {
	return func(s string, args ...interface{}) template.HTML {
		return template.HTML(f(s, args...))
	}
}

// GettextFor returns the gettext function for the requested locale. In case the
// default locale is passed, fmt.Sprintf will be returned.
func GettextFor(locale string) (func(string, ...interface{}) template.HTML, error) {
	if locale == defaultLocale {
		return wrapFmt(fmt.Sprintf), nil
	}

	file, err := public.FS.Open(fmt.Sprintf("static/locales/%s.po", locale))
	if err != nil {
		return nil, fmt.Errorf("locales: error opening file for locale %s: %w", locale, err)
	}

	b, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("locales: error reading file contents for locale %s: %w", locale, err)
	}

	po := gotext.NewPo()
	po.Parse(b)
	return wrapFmt(po.Get), nil
}
