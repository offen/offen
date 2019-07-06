package router

import (
	"net/http"
	"time"
)

const transPixel = "\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00\x21\xF9\x04\x01\x00\x00\x00\x00\x2C\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3B"

func (rt *router) optout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Last-Modified", time.Now().UTC().Format(http.TimeFormat))
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Pragma", "no-cache")
	http.SetCookie(w, rt.optoutCookie())
	w.Write([]byte(transPixel))
}
