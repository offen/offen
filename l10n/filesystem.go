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

// GetLocaleStrings returns the map of strings for the given locale if available.
func GetLocaleStrings(locale string) (map[string]string, error) {
	file, err := FS.Open(fmt.Sprintf("/%s.json", locale))
	if err != nil {
		return nil, fmt.Errorf("l10n: error trying to open file for locale %s: %w", locale, err)
	}
	b, err := ioutil.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("l10n: error reading file contents for locale %s: %w", locale, err)
	}
	var strings map[string]string
	if err := json.Unmarshal(b, &strings); err != nil {
		return nil, fmt.Errorf("l10n: error parsing JSON for locale %s: %w", locale, err)
	}
	return strings, nil
}
