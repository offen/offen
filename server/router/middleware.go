package router

import (
	"fmt"
	"net/http"
	"net/url"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		allow := "*"
		if h := r.Header.Get("Origin"); h != "" {
			u, err := url.Parse(h)
			if err == nil && u.Host != "" {
				allow = fmt.Sprintf("%s://%s", u.Scheme, u.Host)
			}
		}
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Methods", "POST,GET")
		w.Header().Set("Access-Control-Allow-Origin", allow)
		next.ServeHTTP(w, r)
	})
}

func contentTypeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}

func doNotTrackMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if dnt := r.Header.Get("DNT"); dnt == "1" {
			return
		}
		next.ServeHTTP(w, r)
	})
}
