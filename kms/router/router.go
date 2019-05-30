package router

import (
	"encoding/json"
	"net/http"

	"github.com/offen/offen/kms/keymanager"
	"github.com/sirupsen/logrus"
)

type router struct {
	logger  *logrus.Logger
	manager keymanager.Manager
}

func New(manager keymanager.Manager, logger *logrus.Logger, corsOrigin string) http.Handler {
	return &router{logger: logger, manager: manager}
}

func (rt *router) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		rt.handleGet(w, r)
		return
	case http.MethodPost:
		rt.handlePost(w, r)
		return
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (rt *router) logError(err error, message string) {
	if rt.logger != nil {
		rt.logger.WithError(err).Error(message)
	}
}

type getResponse struct {
	SecretKey string `json:"secret_key"`
}

func (rt *router) handleGet(w http.ResponseWriter, r *http.Request) {
	encryptedKey := r.URL.Query().Get("encrypted_key")
	if encryptedKey == "" {
		http.Error(w, "missing or empty `encrypted_key` parameter", http.StatusBadRequest)
		return
	}
	decrypted, err := rt.manager.Decrypt(encryptedKey)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	res := getResponse{
		SecretKey: decrypted,
	}
	if err := json.NewEncoder(w).Encode(&res); err != nil {
		rt.logError(err, "error encoding response payload")
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

type postRequest struct {
	SecretKey string `json:"secret_key"`
}

type postResponse struct {
	EncryptedSecretKey string `json:"encrypted_secret_key"`
}

func (rt *router) handlePost(w http.ResponseWriter, r *http.Request) {
	req := postRequest{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad payload", http.StatusBadRequest)
		return
	}

	encrypted, err := rt.manager.Encrypt(req.SecretKey)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res := postResponse{
		EncryptedSecretKey: encrypted,
	}
	if err := json.NewEncoder(w).Encode(&res); err != nil {
		rt.logError(err, "error encoding response payload")
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
