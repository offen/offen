package router

import (
	"html/template"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/offen/offen/server/config"
)

func TestRouter_getRoot(t *testing.T) {
	rt := router{
		config: &config.Config{},
	}
	m := gin.New()
	m.GET("/", rt.getIndex)
	tpl := template.Must(template.New("index.go.html").Parse("ok!"))
	m.SetHTMLTemplate(tpl)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/", nil)

	m.ServeHTTP(w, r)

	if w.Code != http.StatusOK {
		t.Errorf("Unexpected status code %v", w.Code)
	}
}
