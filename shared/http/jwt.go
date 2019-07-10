package http

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/lestrrat-go/jwx/jwa"
	"github.com/lestrrat-go/jwx/jwt"
)

type contextKey string

// ClaimsContextKey will be used to attach a JWT claim to a request context
const ClaimsContextKey contextKey = "claims"

// JWTProtect uses the public key located at the given URL to check if the
// cookie value is signed properly. In case yes, the JWT claims will be added
// to the request context
func JWTProtect(keyURL, cookieName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var jwtValue string
			var isRPC bool
			if authCookie, err := r.Cookie(cookieName); err == nil {
				jwtValue = authCookie.Value
			} else {
				if header := r.Header.Get("X-RPC-Authentication"); header != "" {
					jwtValue = header
					isRPC = true
				}
			}
			if jwtValue == "" {
				RespondWithJSONError(w, errors.New("jwt: could not infer JWT value from cookie or header"), http.StatusForbidden)
				return
			}

			keyRes, keyErr := fetchKey(keyURL)
			if keyErr != nil {
				RespondWithJSONError(w, fmt.Errorf("jwt: error fetching key: %v", keyErr), http.StatusInternalServerError)
				return
			}

			keyBytes, _ := pem.Decode([]byte(keyRes))
			if keyBytes == nil {
				RespondWithJSONError(w, errors.New("jwt: no PEM block found in given key"), http.StatusInternalServerError)
				return
			}

			parseResult, parseErr := x509.ParsePKIXPublicKey(keyBytes.Bytes)
			if parseErr != nil {
				RespondWithJSONError(w, fmt.Errorf("jwt: error parsing key: %v", parseErr), http.StatusBadGateway)
				return
			}

			pubKey, pubKeyOk := parseResult.(*rsa.PublicKey)
			if !pubKeyOk {
				RespondWithJSONError(w, errors.New("jwt: given key is not of type RSA public key"), http.StatusInternalServerError)
				return
			}

			token, jwtErr := jwt.ParseVerify(strings.NewReader(jwtValue), jwa.RS256, pubKey)
			if jwtErr != nil {
				RespondWithJSONError(w, fmt.Errorf("jwt: error parsing token: %v", jwtErr), http.StatusForbidden)
				return
			}

			if err := token.Verify(jwt.WithAcceptableSkew(0)); err != nil {
				RespondWithJSONError(w, fmt.Errorf("jwt: error verifying token: %v", err), http.StatusForbidden)
				return
			}

			privateClaims, _ := token.Get("priv")
			if isRPC {
				cast, ok := privateClaims.(map[string]interface{})
				if !ok {
					RespondWithJSONError(w, fmt.Errorf("jwt: malformed private claims section in token: %v", privateClaims), http.StatusBadRequest)
					return
				}
				if cast["rpc"] != "1" {
					RespondWithJSONError(w, errors.New("jwt: token claims do not allow the requested operation"), http.StatusForbidden)
					return
				}
			}

			r = r.WithContext(context.WithValue(r.Context(), ClaimsContextKey, privateClaims))
			next.ServeHTTP(w, r)
		})
	}
}

type keyResponse struct {
	Key string `json:"key"`
}

func fetchKey(keyURL string) ([]byte, error) {
	fetchRes, fetchErr := http.Get(keyURL)
	if fetchErr != nil {
		return nil, fetchErr
	}
	defer fetchRes.Body.Close()
	payload := keyResponse{}
	if err := json.NewDecoder(fetchRes.Body).Decode(&payload); err != nil {
		return nil, err
	}
	return []byte(payload.Key), nil
}
