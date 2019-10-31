package assets

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"

	_ "github.com/offen/offen/server/assets/statik"
	"github.com/rakyll/statik/fs"
)

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

// HTMLTemplate creates a template object containing all of the templates in the
// public file system
func HTMLTemplate() (*template.Template, error) {
	t := template.New("index.go.html")
	templates := []string{"/index.go.html"}
	for _, file := range templates {
		f, err := FS.Open(file)
		if err != nil {
			return nil, fmt.Errorf("assets: error finding template file %s: %w", file, err)
		}
		b, err := ioutil.ReadAll(f)
		if err != nil {
			return nil, fmt.Errorf("assets: error reading template file %s: %w", file, err)
		}
		t, err = t.Parse(string(b))
		if err != nil {
			return nil, fmt.Errorf("assets: error parsing template file %s: %w", file, err)
		}
	}
	return t, nil
}
