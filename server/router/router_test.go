package router

import (
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/persistence"
)

type mockDatabase struct {
	persistence.Database
}

func TestMain(m *testing.M) {
	gin.SetMode(gin.ReleaseMode)
	os.Exit(m.Run())
}

func TestNew(t *testing.T) {
	New(
		WithDatabase(&mockDatabase{}),
		WithSecureCookie(true),
	)
}
