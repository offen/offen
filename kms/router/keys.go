package router

import (
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"net/http"

	"github.com/mendsley/gojwk"
)

type encryptedPayload struct {
	EncryptedValue string `json:"encrypted,omit"`
}

type decryptedPayload struct {
	DecryptedValue interface{} `json:"decrypted,omit"`
}

func (rt *router) handleDecrypt(w http.ResponseWriter, r *http.Request) {
	asJWK := r.URL.Query().Get("jwk") != ""
	req := encryptedPayload{}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad payload", http.StatusBadRequest)
		return
	}

	b, _ := base64.StdEncoding.DecodeString(req.EncryptedValue)

	decrypted, err := rt.manager.Decrypt(b)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var res decryptedPayload
	if asJWK {
		// this branch wraps the store PEM key in a JSON Web Key so web clients
		// can easily consume it
		decoded, _ := pem.Decode(decrypted)
		if decoded == nil {
			http.Error(w, "error decoding decrypted key in PEM format", http.StatusInternalServerError)
			return
		}

		priv, privErr := x509.ParsePKCS1PrivateKey(decoded.Bytes)
		if privErr != nil {
			http.Error(w, privErr.Error(), http.StatusInternalServerError)
			return
		}

		key, keyErr := gojwk.PrivateKey(priv)
		if keyErr != nil {
			http.Error(w, keyErr.Error(), http.StatusInternalServerError)
			return
		}
		res.DecryptedValue = key
	} else {
		res.DecryptedValue = string(decrypted)
	}

	if err := json.NewEncoder(w).Encode(&res); err != nil {
		rt.logError(err, "error encoding response payload")
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (rt *router) handleEncrypt(w http.ResponseWriter, r *http.Request) {
	req := decryptedPayload{}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad payload", http.StatusBadRequest)
		return
	}

	asString, ok := req.DecryptedValue.(string)
	if !ok {
		http.Error(w, "expected `decrypted` to be a non-empty string", http.StatusBadRequest)
		return
	}

	encrypted, err := rt.manager.Encrypt([]byte(asString))
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res := encryptedPayload{
		EncryptedValue: base64.StdEncoding.EncodeToString([]byte(encrypted)),
	}
	if err := json.NewEncoder(w).Encode(&res); err != nil {
		rt.logError(err, "error encoding response payload")
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
