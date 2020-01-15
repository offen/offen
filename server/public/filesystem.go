package public

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"

	ginrender "github.com/gin-gonic/gin/render"
	_ "github.com/offen/offen/server/public/statik"
	"github.com/rakyll/statik/fs"
)

const defaultLocale = "en"

type localizedFS struct {
	locale string
	root   http.FileSystem
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
			return f, nil
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

// HTMLRender creates a gin HTML renderer containing all of the templates in the
// public file system.
func HTMLRender(gettext func(string, ...interface{}) template.HTML) (ginrender.HTMLRender, error) {
	views := []string{"views/index.go.html"}

	result := map[string]*template.Template{}
	for _, view := range views {
		t := template.New(view)
		t.Funcs(template.FuncMap{
			"__": gettext,
		})

		addFile := func(file string) error {
			f, err := FS.Open("/" + file)
			if err != nil {
				return fmt.Errorf("public: error finding template file %s: %w", view, err)
			}
			b, err := ioutil.ReadAll(f)
			if err != nil {
				return fmt.Errorf("public: error reading template file %s: %w", view, err)
			}
			t, err = t.Parse(string(b))
			if err != nil {
				return fmt.Errorf("public: error parsing template file %s: %w", view, err)
			}
			return nil
		}

		if err := addFile("templates/layout.go.html"); err != nil {
			return nil, err
		}
		if err := addFile(view); err != nil {
			return nil, err
		}
		result[view] = t
	}
	return &htmlRender{templates: result}, nil
}

type render struct {
	tpl         *template.Template
	data        interface{}
	contentType string
}

func (r *render) Render(w http.ResponseWriter) error {
	return r.tpl.ExecuteTemplate(w, "layout", r.data)
}

func (r *render) WriteContentType(w http.ResponseWriter) {
	w.Header().Set("Content-Type", r.contentType)
}

type htmlRender struct {
	templates map[string]*template.Template
}

func (h *htmlRender) Instance(name string, data interface{}) ginrender.Render {
	tpl, ok := h.templates[name]
	if !ok {
		panic(fmt.Errorf("Requested template %s unknown", name))
	}
	return &render{
		tpl:         tpl,
		data:        data,
		contentType: "text/html; charset=utf-8",
	}
}
