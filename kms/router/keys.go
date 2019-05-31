package router

import (
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"net/http"

	"github.com/mendsley/gojwk"
)

type encryptedPayload struct {
	EncryptedPrivateKey string `json:"encrypted_private_key,omit"`
}

type decryptedPayload struct {
	DecryptedPrivateKey interface{} `json:"decrypted_private_key,omit"`
}

func (rt *router) handleDecrypt(w http.ResponseWriter, r *http.Request) {
	asJWK := r.URL.Query().Get("jwk") != ""
	req := encryptedPayload{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad payload", http.StatusBadRequest)
		return
	}
	decrypted, err := rt.manager.Decrypt(req.EncryptedPrivateKey)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var res decryptedPayload
	if asJWK {
		// this branch wraps the store PEM key in a JSON Web Key so web clients
		// can easily consume it
		decoded, _ := pem.Decode([]byte(decrypted))
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
		res.DecryptedPrivateKey = key
	} else {
		res.DecryptedPrivateKey = decrypted
	}

	if err := json.NewEncoder(w).Encode(&res); err != nil {
		rt.logError(err, "error encoding response payload")
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (rt *router) handleEncrypt(w http.ResponseWriter, r *http.Request) {
	req := decryptedPayload{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad payload", http.StatusBadRequest)
		return
	}

	asString, ok := req.DecryptedPrivateKey.(string)
	if !ok {
		http.Error(w, "expected `decrypted_secret_key` to be a string", http.StatusBadRequest)
		return
	}

	encrypted, err := rt.manager.Encrypt(asString)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	res := encryptedPayload{
		EncryptedPrivateKey: encrypted,
	}
	if err := json.NewEncoder(w).Encode(&res); err != nil {
		rt.logError(err, "error encoding response payload")
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
