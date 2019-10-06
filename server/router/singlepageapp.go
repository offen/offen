package router

import "net/http"

type rwWithStatus struct {
	http.ResponseWriter
	status int
}

func (w *rwWithStatus) WriteHeader(status int) {
	w.status = status // Store the status for our own use
	if status != http.StatusNotFound {
		w.ResponseWriter.WriteHeader(status)
	}
}

func (w *rwWithStatus) Write(p []byte) (int, error) {
	if w.status != http.StatusNotFound {
		return w.ResponseWriter.Write(p)
	}
	return len(p), nil // Lie that we successfully written it
}

func singlePageAppMiddleware(root string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			withStatus := &rwWithStatus{w, 0}
			next.ServeHTTP(withStatus, r)
			if withStatus.status == http.StatusNotFound {
				replacement, _ := http.NewRequest(r.Method, root, nil)
				w.Header().Set("Content-Type", "text/html")
				next.ServeHTTP(w, replacement)
			}
		})
	}
}
