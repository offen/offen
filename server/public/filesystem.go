// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package public

import (
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"os"
	"path"

	// imported for reading fs content side effects
	_ "github.com/offen/offen/server/statik"
	"github.com/rakyll/statik/fs"
)

const defaultLocale = "en"

// LocalizedFS is responsible for looking up the assets in a multi-language directory
// tree that match the configured locale. It implements http.Filesystem
type LocalizedFS struct {
	locale string
	root   http.FileSystem
}

// rev is a function that can be used to look up revisioned assets
// in the given file system by specifying their unrevisioned name. In case no
// revisioned asset can be found the original asset name is returned.
func (l *LocalizedFS) rev(location string) string {
	dir := path.Dir(location)
	manifestFile, manifestErr := l.Open(path.Join(dir, "rev-manifest.json"))
	if manifestErr != nil {
		return location
	}

	revs := map[string]string{}
	json.NewDecoder(manifestFile).Decode(&revs)
	if match, ok := revs[path.Base(location)]; ok {
		return path.Join(dir, match)
	}
	return location
}

// Open looks up the requested file by location.
func (l *LocalizedFS) Open(file string) (http.File, error) {
	cascade := []string{
		fmt.Sprintf("/%s%s", l.locale, file),
		fmt.Sprintf("/%s%s", defaultLocale, file),
		file,
	}
	var err error
	var f http.File
	for _, location := range cascade {
		f, err = l.root.Open(location)
		if err == nil {
			return neuteredReaddirFile{f}, nil
		}
	}
	return nil, err
}

func newStatikFS(fallbackRoot string) http.FileSystem {
	statikFS, err := fs.New()
	if err != nil {
		// This is here for development when the statik packages have not
		// been populated. The filesystem will likely not match the requested
		// files. In development live-reloading static assets will be routed through
		// nginx instead.
		return http.Dir(fallbackRoot)
	}
	return statikFS
}

// NewLocalizedFS returns a http.FileSystem that is locale aware. It will first
// try to return the file in the given locale. In case this is not found, it tries
// returning the asset in the default language, falling back to the root fs if
// this isn't found either.
func NewLocalizedFS(locale string) *LocalizedFS {
	return &LocalizedFS{
		locale: locale,
		root:   newStatikFS("./public"),
	}
}

// HTMLTemplate creates a template object containing all of the HTML templates in the
// public file system
func (l *LocalizedFS) HTMLTemplate(gettext func(string, ...interface{}) template.HTML) (*template.Template, error) {
	return l.getTemplate(
		"html_template",
		[]string{"/index.go.html"},
		template.FuncMap{
			"__": gettext,
		},
	)
}

// EmailTemplate creates a template object containing all of the email templates in the
// public file system
func (l *LocalizedFS) EmailTemplate(gettext func(string, ...interface{}) template.HTML) (*template.Template, error) {
	return l.getTemplate(
		"email_template",
		[]string{"/emails.go.html"},
		template.FuncMap{
			"__": gettext,
		},
	)
}

func (l *LocalizedFS) getTemplate(name string, templateFiles []string, funcMap template.FuncMap) (*template.Template, error) {
	t := template.New(name)
	funcMap["rev"] = l.rev
	t.Funcs(funcMap)

	for _, file := range templateFiles {
		f, err := l.root.Open(file)
		if err != nil {
			return nil, fmt.Errorf("public: error finding file %s: %w", file, err)
		}
		b, err := ioutil.ReadAll(f)
		if err != nil {
			return nil, fmt.Errorf("public: error reading from file %s: %w", file, err)
		}
		t, err = t.Parse(string(b))
		if err != nil {
			return nil, fmt.Errorf("public: error parsing template file %s: %w", file, err)
		}
	}
	return t, nil
}

type neuteredReaddirFile struct {
	http.File
}

func (f neuteredReaddirFile) Readdir(count int) ([]os.FileInfo, error) {
	return nil, errors.New("forcefully skipping directory listings")
}
