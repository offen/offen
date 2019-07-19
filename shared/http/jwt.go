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
func JWTProtect(keyURL, cookieName, headerName string, authorizer func(*http.Request, map[string]interface{}) error) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var jwtValue string
			if authCookie, err := r.Cookie(cookieName); err == nil {
				jwtValue = authCookie.Value
			} else {
				if header := r.Header.Get(headerName); header != "" {
					jwtValue = header
				}
			}
			if jwtValue == "" {
				RespondWithJSONError(w, errors.New("jwt: could not infer JWT value from cookie or header"), http.StatusForbidden)
				return
			}

			keys, keysErr := fetchKeys(keyURL)
			if keysErr != nil {
				RespondWithJSONError(w, fmt.Errorf("jwt: error fetching keys: %v", keysErr), http.StatusInternalServerError)
				return
			}

			var token *jwt.Token
			var tokenErr error
			// the response can contain multiple keys to try as some of them
			// might have been retired with signed tokens still in use until
			// their expiry
			for _, key := range keys {
				token, tokenErr = tryParse(key, jwtValue)
				if tokenErr == nil {
					break
				}
			}

			if tokenErr != nil {
				RespondWithJSONError(w, fmt.Errorf("jwt: error verifying token signature: %v", tokenErr), http.StatusForbidden)
				return
			}

			if err := token.Verify(jwt.WithAcceptableSkew(0)); err != nil {
				RespondWithJSONError(w, fmt.Errorf("jwt: error verifying token claims: %v", err), http.StatusForbidden)
				return
			}

			privKey, _ := token.Get("priv")
			claims, _ := privKey.(map[string]interface{})
			if err := authorizer(r, claims); err != nil {
				RespondWithJSONError(w, fmt.Errorf("jwt: token claims do not allow the requested operation: %v", err), http.StatusForbidden)
				return
			}
			r = r.WithContext(context.WithValue(r.Context(), ClaimsContextKey, claims))
			next.ServeHTTP(w, r)
		})
	}
}

func tryParse(key []byte, tokenValue string) (*jwt.Token, error) {
	keyBytes, _ := pem.Decode([]byte(key))
	if keyBytes == nil {
		return nil, errors.New("jwt: no PEM block found in given key")
	}

	parseResult, parseErr := x509.ParsePKIXPublicKey(keyBytes.Bytes)
	if parseErr != nil {
		return nil, fmt.Errorf("jwt: error parsing key: %v", parseErr)
	}

	pubKey, pubKeyOk := parseResult.(*rsa.PublicKey)
	if !pubKeyOk {
		return nil, errors.New("jwt: given key is not of type RSA public key")
	}

	token, jwtErr := jwt.ParseVerify(strings.NewReader(tokenValue), jwa.RS256, pubKey)
	if jwtErr != nil {
		return nil, fmt.Errorf("jwt: error parsing token: %v", jwtErr)
	}
	return token, nil
}

type keyResponse struct {
	Keys []string `json:"keys"`
}

func fetchKeys(keyURL string) ([][]byte, error) {
	fetchRes, fetchErr := http.Get(keyURL)
	if fetchErr != nil {
		return nil, fetchErr
	}
	defer fetchRes.Body.Close()
	payload := keyResponse{}
	if err := json.NewDecoder(fetchRes.Body).Decode(&payload); err != nil {
		return nil, err
	}

	asBytes := [][]byte{}
	for _, key := range payload.Keys {
		asBytes = append(asBytes, []byte(key))
	}
	return asBytes, nil
}
