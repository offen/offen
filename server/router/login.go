package router

import (
	"encoding/json"
	"net/http"

	httputil "github.com/offen/offen/server/shared/http"
)

func (rt *router) getLogin(w http.ResponseWriter, r *http.Request) {
	result, err := rt.db.Login("develop@offen.dev", "develop")
	if err != nil {
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}
	b, _ := json.Marshal(result)
	w.Write(b)
}
