package public

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"

	_ "github.com/offen/offen/server/public/statik"
	"github.com/rakyll/statik/fs"
)

const defaultLocale = "en"

type localizedFS struct {
	locale string
	root   http.FileSystem
}

func (l *localizedFS) Open(file string) (http.File, error) {
	localized, err := l.root.Open(fmt.Sprintf("/%s%s", l.locale, file))
	if err == nil {
		return localized, nil
	}
	defaultAsset, err := l.root.Open(fmt.Sprintf("/%s%s", defaultLocale, file))
	if err == nil {
		return defaultAsset, nil
	}
	return l.root.Open(file)
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
func HTMLTemplate(gettext func(string, ...interface{}) template.HTML) (*template.Template, error) {
	t := template.New("index.go.html")
	t.Funcs(template.FuncMap{
		"__": gettext,
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
