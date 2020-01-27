package router

import (
	"html/template"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/persistence"
)

type mockDatabase struct {
	persistence.Service
}

func TestMain(m *testing.M) {
	gin.SetMode(gin.ReleaseMode)
	os.Exit(m.Run())
}

func TestNew(t *testing.T) {
	New(
		WithDatabase(&mockDatabase{}),
		WithConfig(&config.Config{}),
		WithTemplate(template.New("a test")),
	)
}
