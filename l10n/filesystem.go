package l10n

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	_ "github.com/offen/offen/server/l10n/statik"
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
		FS = http.Dir("./l10n")
	}
}

func GetLocale(locale string) (map[string]string, error) {
	file, err := FS.Open(fmt.Sprintf("/%s.json", locale))
	if err != nil {
		return nil, err
	}
	b, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, err
	}
	var strings map[string]string
	if err := json.Unmarshal(b, &strings); err != nil {
		return nil, err
	}
	return strings, nil
}
