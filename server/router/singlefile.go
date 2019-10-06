package router

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func serveSingleFile(fs http.FileSystem, fileName, contentType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		f, err := fs.Open(fileName)
		if err != nil {
			c.AbortWithError(
				http.StatusNotFound,
				fmt.Errorf("router: unable to find %s: %v", fileName, err),
			)
			return
		}
		stat, err := f.Stat()
		if err != nil {
			c.AbortWithError(
				http.StatusInternalServerError,
				fmt.Errorf("router: error reading size of %s: %v", fileName, err),
			)
			return
		}
		c.DataFromReader(http.StatusOK, stat.Size(), contentType, f, map[string]string{})
	}
}
