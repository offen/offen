package router

import (
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"

	jwk "github.com/lestrrat-go/jwx/jwk"
	httputil "github.com/offen/offen/kms/shared/http"
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
		httputil.RespondWithJSONError(w, fmt.Errorf("router: error decoding request body: %v", err), http.StatusBadRequest)
		return
	}

	b, _ := base64.StdEncoding.DecodeString(req.EncryptedValue)

	decrypted, decryptedErr := rt.manager.Decrypt(b)
	if decryptedErr != nil {
		err := fmt.Errorf("router: error decrypting payload: %v", decryptedErr)
		rt.logError(err, "Internal Server Error")
		httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
		return
	}

	var res decryptedPayload
	if asJWK {
		// this branch wraps the store PEM key in a JSON Web Key so web clients
		// can easily consume it
		decoded, _ := pem.Decode(decrypted)
		if decoded == nil {
			err := errors.New("router: error decoding decrypted key in PEM format")
			rt.logError(err, "Internal Server Error")
			httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
			return
		}

		priv, privErr := x509.ParsePKCS1PrivateKey(decoded.Bytes)
		if privErr != nil {
			err := fmt.Errorf("router: error parsing PEM key: %v", privErr)
			rt.logError(err, "Internal Server Error")
			httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
			return
		}

		key, keyErr := jwk.New(priv)
		if keyErr != nil {
			err := fmt.Errorf("router: creating JWK from key: %v", keyErr)
			rt.logError(err, "error creating JWK")
			httputil.RespondWithJSONError(w, err, http.StatusInternalServerError)
			return
		}
		res.DecryptedValue = key
	} else {
		res.DecryptedValue = string(decrypted)
	}

	responseJSON, _ := json.Marshal(&res)
	w.Write(responseJSON)
}

func (rt *router) handleEncrypt(w http.ResponseWriter, r *http.Request) {
	req := decryptedPayload{}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondWithJSONError(w, fmt.Errorf("router: error decoding request body: %v", err), http.StatusBadRequest)
		return
	}

	asString, ok := req.DecryptedValue.(string)
	if !ok {
		err := errors.New("router: expected 'decrypted' to be a non-empty string")
		httputil.RespondWithJSONError(w, err, http.StatusBadRequest)
		return
	}

	encrypted, err := rt.manager.Encrypt([]byte(asString))
	if err != nil {
		httputil.RespondWithJSONError(w, fmt.Errorf("router: error encrypting given value: %v", err), http.StatusBadRequest)
		return
	}

	res := encryptedPayload{
		EncryptedValue: base64.StdEncoding.EncodeToString([]byte(encrypted)),
	}

	responseJSON, _ := json.Marshal(&res)
	w.Write(responseJSON)
}
