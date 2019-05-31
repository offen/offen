package router

import (
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"net/http"

	jwk "github.com/lestrrat-go/jwx/jwk"
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
		respondWithError(w, err, http.StatusBadRequest)
		return
	}

	b, _ := base64.StdEncoding.DecodeString(req.EncryptedValue)

	decrypted, err := rt.manager.Decrypt(b)
	if err != nil {
		rt.logError(err, "error decrypting payload")
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}

	var res decryptedPayload
	if asJWK {
		// this branch wraps the store PEM key in a JSON Web Key so web clients
		// can easily consume it
		decoded, _ := pem.Decode(decrypted)
		if decoded == nil {
			rt.logError(errors.New("error decoding decrypted key in PEM format"), "error decoding decrypted key in PEM format")
			respondWithError(w, errors.New("error decoding decrypted key in PEM format"), http.StatusInternalServerError)
			return
		}

		priv, privErr := x509.ParsePKCS1PrivateKey(decoded.Bytes)
		if privErr != nil {
			rt.logError(privErr, "error parsing PEM key")
			respondWithError(w, privErr, http.StatusInternalServerError)
			return
		}

		key, keyErr := jwk.New(priv)
		if keyErr != nil {
			rt.logError(keyErr, "error creating JWK")
			respondWithError(w, keyErr, http.StatusInternalServerError)
			return
		}
		res.DecryptedValue = key
	} else {
		res.DecryptedValue = string(decrypted)
	}

	responseJSON, err := json.Marshal(&res)
	if err != nil {
		rt.logError(err, "error encoding response payload")
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(responseJSON)
}

func (rt *router) handleEncrypt(w http.ResponseWriter, r *http.Request) {
	req := decryptedPayload{}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, err, http.StatusBadRequest)
		return
	}

	asString, ok := req.DecryptedValue.(string)
	if !ok {
		respondWithError(w, errors.New("expected `decrypted` to be a non-empty string"), http.StatusBadRequest)
		return
	}

	encrypted, err := rt.manager.Encrypt([]byte(asString))
	if err != nil {
		respondWithError(w, err, http.StatusBadRequest)
		return
	}

	res := encryptedPayload{
		EncryptedValue: base64.StdEncoding.EncodeToString([]byte(encrypted)),
	}

	responseJSON, err := json.Marshal(&res)
	if err != nil {
		rt.logError(err, "error encoding response payload")
		respondWithError(w, err, http.StatusInternalServerError)
		return
	}
	w.Write(responseJSON)
}
