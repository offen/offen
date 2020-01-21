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

	_ "github.com/offen/offen/server/public/statik"
	"github.com/rakyll/statik/fs"
)

const defaultLocale = "en"

type localizedFS struct {
	locale string
	root   http.FileSystem
}

// RevWith returns a function that can be used to look up revisioned assets
// in the given file system by specifying their unrevisioned name. In case no
// revisioned asset can be found the original asset name is returned.
func RevWith(fs http.FileSystem) func(string) string {
	return func(location string) string {
		dir := path.Dir(location)
		manifestFile, manifestErr := fs.Open(path.Join(dir, "rev-manifest.json"))
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
}

func (l *localizedFS) Open(file string) (http.File, error) {
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
		FS = http.Dir("./public")
	}
}

// NewLocalizedFS returns a http.FileSystem that is locale aware. It will first
// try to return the file in the given locale. In case this is not found, it tries
// returning the asset in the default language, falling back to the root fs if
// this isn't found either.
func NewLocalizedFS(locale string) http.FileSystem {
	return &localizedFS{
		locale: locale,
		root:   FS,
	}
}

// HTMLTemplate creates a template object containing all of the templates in the
// public file system
func HTMLTemplate(gettext func(string, ...interface{}) template.HTML, rev func(string) string) (*template.Template, error) {
	t := template.New("index.go.html")
	t.Funcs(template.FuncMap{
		"__":  gettext,
		"rev": rev,
	})
	templates := []string{"/index.go.html"}
	for _, file := range templates {
		f, err := FS.Open(file)
		if err != nil {
			return nil, fmt.Errorf("public: error finding template file %s: %w", file, err)
		}
		b, err := ioutil.ReadAll(f)
		if err != nil {
			return nil, fmt.Errorf("public: error reading template file %s: %w", file, err)
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
