package http

import (
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/lestrrat-go/jwx/jwa"

	"github.com/lestrrat-go/jwx/jwt"
)

const publicKey = `
-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAl2ifzOsh6AMRHZBe8xycvk01s3EAGT12WbgV9Z7b420Dj3NXrkns
N/jvBbtO9cjQg4WM7NPZLs+ZutRkHCtMxt7vB0kjOYetLPcGdObsVBB5k1jvwvsJ
HkcfmSsZdrV0Lz2Yxuf6ADWkxBqAY3GsS0zW0A2nIMc+41ZxqsZa3ProsKJxecRX
SSZMpZtqCGt/S83Rek4eAahllcWfZpQmoEk7usLuUl5tH2TmaW3e5lo0JNfdwcq5
PMCa8WSZBFH3YzVttB8rbe7a7336wL2NJQFz6dswL5X1dECYpZ5TRtNgzQYa4V0W
AeICq+EzigaTxrjDHc5urHqEosz1le7O4QIDAQAB
-----END RSA PUBLIC KEY-----
`

const privateKey = `
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCXaJ/M6yHoAxEd
kF7zHJy+TTWzcQAZPXZZuBX1ntvjbQOPc1euSew3+O8Fu071yNCDhYzs09kuz5m6
1GQcK0zG3u8HSSM5h60s9wZ05uxUEHmTWO/C+wkeRx+ZKxl2tXQvPZjG5/oANaTE
GoBjcaxLTNbQDacgxz7jVnGqxlrc+uiwonF5xFdJJkylm2oIa39LzdF6Th4BqGWV
xZ9mlCagSTu6wu5SXm0fZOZpbd7mWjQk193Byrk8wJrxZJkEUfdjNW20Hytt7trv
ffrAvY0lAXPp2zAvlfV0QJilnlNG02DNBhrhXRYB4gKr4TOKBpPGuMMdzm6seoSi
zPWV7s7hAgMBAAECggEAYoPOxjSP4ThtoIDZZvHNAv2V3WW/HK0jHolqsGBmznmW
AXaZLGwo6NpuG5qea8n38jupUEcfXxfw/OFJKhL6Z8OSX3k1FC+1fDZW2yWNy7zU
fg02I/XXHv5EDxM+BEFYkYxQpcs2nYBJ7tcXhpzl8DDU7JaVkfxSbPVIDEf3wyP2
k6DjYEeAj7uAsp50/32H9zhlJP/cFZaPiyFYy9/gOmDenrPVyJ/f7iQYNwYAwdbt
yfp11Wd5BpePR58+YXICE8oBtzHvB50akK6RZULC3xHVxLQQ1bSxx6vnttxw5RW+
QRHTVWtRyWiKe/l5jMvVSUo5XCLqsL2iXfR4bz6hyQKBgQDJQVWEGHyD6JyaN/6i
5M5+O/YTbzMBgt1JAuVR2c0HYE4LpgrX4cA4kT3Bsa/Z9o0uuWVuxVab5gLsjsDu
EI4o+HJQ3pl4LF9xqrndTdybwmZAT6jv3rM/VGfaCDzXCPzVx169I+WsfkyGW7Tr
Cj4KDZyykruG/9OrpN1Aeq9a3wKBgQDAmCnQHLEPvZdezJGBc34HjZntrbW67iFB
L0waCGWydyunYmzfja1FSvlSoziZdqoq0N4+uBQFPZIlERvq0zMgIzNFvxt/WlFV
kQcBV24MNa8dtd+P7GDY8TzTfYBeXwJoi5c59sWLzSwpTlw0rI+ZvuA66eEF7xih
eWw3k1jOPwKBgQCKf8DHGEbQTEtBQlmlZkrIyqDs/PCgEJwSe8Cu1HFpqxfqokkC
CiTLiQB0BMEdAbRlPEcWtQ2GWgMXIqKY8qGyhk+9YYNCFV9VjQU9zDCOrHjLt0Zu
VNcMNR0HCfY8kb3VrM+A4GxVidFGAWR+/9xz9KwqpBoTrIjRrbJphkSZBwKBgBMs
0zTqNmLH0JNasL3/vrOH0KSOYAKdhOgVinEpFt7+6HTA4vAbDf5RKaOlppP48ZZT
t1ztPOkMqUlRe8MUhgmUF53BGj7CwkhPqS/kAYvrqGS/3+NXeIkA87pmy2oZ8YZx
J3xY6nAx3Ey8hYelCqMXEwIqmQHbPUuOaEzcOcJHAoGANw0TRha2YSbUqS3HiGR/
Jm0lNfeLc3cYlEq0ggRDPLD11485rxVKnaKVHGPYW28OQ4jA+GCc7VZCfPV8VQXW
6b+jUnnBwu/KuYvGMee/xJv1c4MTG54mR9UrUt+R80S0OplpcYkcQnft2Bi+AZ1h
5aZTE7XIouXCYiMKPl4AMtI=
-----END PRIVATE KEY-----
`

func TestJWTProtect(t *testing.T) {
	tests := []struct {
		name               string
		cookie             *http.Cookie
		headers            *http.Header
		server             *httptest.Server
		authorizer         func(r *http.Request, claims map[string]interface{}) error
		expectedStatusCode int
	}{
		{
			"no cookie",
			nil,
			nil,
			nil,
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusForbidden,
		},
		{
			"bad server",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			nil,
			nil,
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusInternalServerError,
		},
		{
			"non-json response",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			nil,
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("here's some bytes 4 y'all"))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusInternalServerError,
		},
		{
			"bad key value",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			nil,
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(`{"keys":["not really a key","me neither"]}`))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusForbidden,
		},
		{
			"invalid key",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			nil,
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(`{"keys":["-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCATZAMIIBCgKCAQEA2yUfHH6SRYKvBTemrefi\nHk4L4qkcc4skl4QCaHOkfgA4VcGKG2nXysYuZK7AzNOcHQVi+e4BwN+BfIZtwEU5\n7Ogctb5eg8ksxxLjS7eSRfQIvPGfAbJ12R9OoOWcue/CdUy/YMec4R/o4+tZ45S6\nQQWIMhLqYljw+s1Runda3K8Q8lOdJ4yEZckXaZr1waNJikC7oGpT7ClAgdbvWIbo\nN18G1OluRn+3WNdcN6V+vIj8c9dGs92bgTPX4cn3RmB/80BDfzeFiPMRw5xaq66F\n42zXzllkTqukQPk2wmO5m9pFy0ciRve+awfgbTtZRZOEpTSWLbbpOfd4RQ5YqDWJ\nmQIDAQAB\n-----END PUBLIC KEY-----"]}`))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusForbidden,
		},
		{
			"valid key, bad auth token",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			nil,
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(
					fmt.Sprintf(`{"keys":["%s"]}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
				))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusForbidden,
		},
		{
			"valid key, valid token",
			&http.Cookie{
				Name: "auth",
				Value: (func() string {
					token := jwt.New()
					token.Set("exp", time.Now().Add(time.Hour))
					keyBytes, _ := pem.Decode([]byte(privateKey))
					privKey, _ := x509.ParsePKCS8PrivateKey(keyBytes.Bytes)
					b, _ := token.Sign(jwa.RS256, privKey)
					return string(b)
				})(),
			},
			nil,
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(
					fmt.Sprintf(`{"keys":["%s"]}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
				))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusOK,
		},
		{
			"ok token in headers",
			nil,
			(func() *http.Header {
				token := jwt.New()
				token.Set("exp", time.Now().Add(time.Hour))
				keyBytes, _ := pem.Decode([]byte(privateKey))
				privKey, _ := x509.ParsePKCS8PrivateKey(keyBytes.Bytes)
				b, _ := token.Sign(jwa.RS256, privKey)
				return &http.Header{
					"X-RPC-Authentication": []string{string(b)},
				}
			})(),
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(
					fmt.Sprintf(`{"keys":["%s"]}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
				))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusOK,
		},
		{
			"bad token in headers",
			nil,
			(func() *http.Header {
				return &http.Header{
					"X-RPC-Authentication": []string{"nilly willy"},
				}
			})(),
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(
					fmt.Sprintf(`{"keys":["%s"]}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
				))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusForbidden,
		},
		{
			"authorizer rejects",
			&http.Cookie{
				Name: "auth",
				Value: (func() string {
					token := jwt.New()
					token.Set("exp", time.Now().Add(time.Hour))
					token.Set("priv", map[string]interface{}{"ok": false})
					keyBytes, _ := pem.Decode([]byte(privateKey))
					privKey, _ := x509.ParsePKCS8PrivateKey(keyBytes.Bytes)
					b, _ := token.Sign(jwa.RS256, privKey)
					return string(b)
				})(),
			},
			nil,
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(
					fmt.Sprintf(`{"keys":["%s"]}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
				))
			})),
			func(r *http.Request, claims map[string]interface{}) error {
				if claims["ok"] == true {
					return nil
				}
				return errors.New("expected ok to be true")
			},
			http.StatusForbidden,
		},
		{
			"valid key, expired token",
			&http.Cookie{
				Name: "auth",
				Value: (func() string {
					token := jwt.New()
					token.Set("exp", time.Now().Add(-time.Hour))
					keyBytes, _ := pem.Decode([]byte(privateKey))
					privKey, _ := x509.ParsePKCS8PrivateKey(keyBytes.Bytes)
					b, _ := token.Sign(jwa.RS256, privKey)
					return string(b)
				})(),
			},
			nil,
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(
					fmt.Sprintf(`{"keys":["%s"]}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
				))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusForbidden,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var url string
			if test.server != nil {
				url = test.server.URL
			}
			wrappedHandler := JWTProtect(url, "auth", "X-RPC-Authentication", test.authorizer)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("OK"))
			}))
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			if test.cookie != nil {
				r.AddCookie(test.cookie)
			}
			if test.headers != nil {
				for key, value := range *test.headers {
					r.Header.Add(key, value[0])
				}
			}
			wrappedHandler.ServeHTTP(w, r)
			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
		})
	}
}
