package router

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/offen/offen/server/keys"
	httputil "github.com/offen/offen/server/shared/http"
)

func serveCookie(cookie *http.Cookie, w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Last-Modified", time.Now().UTC().Format(http.TimeFormat))
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Pragma", "no-cache")
	http.SetCookie(w, cookie)
	w.WriteHeader(http.StatusNoContent)
}

func (rt *router) postOptoutOptin(w http.ResponseWriter, r *http.Request) {
	authentication, err := keys.NewAuthentication(rt.cookieExchangeSecret, time.Second*30)
	if err != nil {
		httputil.RespondWithJSONError(w, fmt.Errorf("error initiating authentication exchange: %v", err), http.StatusInternalServerError)
		return
	}
	b, _ := json.Marshal(authentication)
	w.Write(b)
}

func (rt *router) validateOnetimeAuth(v url.Values) error {
	expires, expiresErr := strconv.ParseInt(v.Get("expires"), 10, 0)
	if expiresErr != nil {
		return expiresErr
	}
	requestAuth := keys.Authentication{
		Expires:   expires,
		Token:     v.Get("token"),
		Signature: v.Get("signature"),
	}
	return requestAuth.Validate(rt.cookieExchangeSecret)
}

func (rt *router) getOptout(w http.ResponseWriter, r *http.Request) {
	if err := rt.validateOnetimeAuth(r.URL.Query()); err != nil {
		httputil.RespondWithJSONError(w, fmt.Errorf("credentials not valid: %v", err), http.StatusForbidden)
		return
	}
	serveCookie(rt.optoutCookie(true), w, r)
}

func (rt *router) getOptin(w http.ResponseWriter, r *http.Request) {
	if err := rt.validateOnetimeAuth(r.URL.Query()); err != nil {
		httputil.RespondWithJSONError(w, fmt.Errorf("credentials not valid: %v", err), http.StatusForbidden)
		return
	}
	serveCookie(rt.optoutCookie(false), w, r)
}
