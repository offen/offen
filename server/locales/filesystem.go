// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package locales

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"

	"github.com/leonelquinteros/gotext"
	_ "github.com/offen/offen/server/locales/statik"
	"github.com/rakyll/statik/fs"
)

const defaultLocale = "en"

// FS is a file system containing the static assets for serving the application
var FS http.FileSystem

func init() {
	var err error
	FS, err = fs.New()
	if err != nil {
		// This is here for development when the statik packages have not
		// been populated. The filesystem will likely not match the requested
		// files. In development live-reloading static assets will be routed through
		// nginx instead.
		FS = http.Dir("./locales")
	}
}

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
	file, err := FS.Open(fmt.Sprintf("/%s.po", locale))
	if err != nil {
		return nil, fmt.Errorf("locales: error opening file for locale %s: %w", locale, err)
	}
	b, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("locales: error reading file contents for locale %s: %w", locale, err)
	}

	po := gotext.Po{}
	po.Parse(b)
	return wrapFmt(po.Get), nil
}
