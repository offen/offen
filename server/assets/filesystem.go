package assets

import (
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
