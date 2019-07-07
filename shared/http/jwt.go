package http

import (
	"context"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"net/http"
	"strings"

	"github.com/lestrrat-go/jwx/jwa"
	"github.com/lestrrat-go/jwx/jwt"
)

type keyResponse struct {
	Key string `json:"key"`
}

type contextKey string

// ClaimsContextKey will be used to attach a JWT claim to a request context
const ClaimsContextKey contextKey = "claims"

// JWTProtect uses the public key located at the given URL to check if the
// cookie value is signed properly. In case yes, the JWT claims will be added
// to the request context
func JWTProtect(keyURL, cookieName string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authCookie, err := r.Cookie(cookieName)
			if err != nil {
				RespondWithJSONError(w, err, http.StatusForbidden)
				return
			}
			keyRes, keyErr := http.Get(keyURL)
			if keyErr != nil {
				RespondWithJSONError(w, keyErr, http.StatusInternalServerError)
				return
			}
			defer keyRes.Body.Close()
			payload := keyResponse{}
			if err := json.NewDecoder(keyRes.Body).Decode(&payload); err != nil {
				RespondWithJSONError(w, keyErr, http.StatusBadGateway)
				return
			}
			keyBytes, _ := pem.Decode([]byte(payload.Key))
			if keyBytes == nil {
				RespondWithJSONError(w, errors.New("no pem block found"), http.StatusInternalServerError)
				return
			}
			parseResult, parseErr := x509.ParsePKIXPublicKey(keyBytes.Bytes)
			if parseErr != nil {
				RespondWithJSONError(w, parseErr, http.StatusBadGateway)
				return
			}
			pubKey, pubKeyOk := parseResult.(*rsa.PublicKey)
			if !pubKeyOk {
				RespondWithJSONError(w, errors.New("unable to use given key"), http.StatusInternalServerError)
				return
			}

			token, jwtErr := jwt.ParseVerify(strings.NewReader(authCookie.Value), jwa.RS256, pubKey)
			if jwtErr != nil {
				RespondWithJSONError(w, jwtErr, http.StatusForbidden)
				return
			}

			if err := token.Verify(jwt.WithAcceptableSkew(0)); err != nil {
				RespondWithJSONError(w, err, http.StatusForbidden)
				return
			}

			privateClaims, _ := token.Get("priv")
			r = r.WithContext(context.WithValue(r.Context(), ClaimsContextKey, privateClaims))

			next.ServeHTTP(w, r)
		})
	}
}
