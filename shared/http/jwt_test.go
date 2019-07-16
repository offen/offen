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
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2yUfHH6SRYKvBTemrefi
Hk4L4qkcc4skl4QCaHOkfgA4VcGKG2nXysYuZK7AzNOcHQVi+e4BwN+BfIZtwEU5
7Ogctb5eg8ksxxLjS7eSRfQIvPGfAbJ12R9OoOWcue/CdUy/YMec4R/o4+tZ45S6
QQWIMhLqYljw+s1Runda3K8Q8lOdJ4yEZckXaZr1waNJikC7oGpT7ClAgdbvWIbo
N18G1OluRn+3WNdcN6V+vIj8c9dGs92bgTPX4cn3RmB/80BDfzeFiPMRw5xaq66F
42zXzllkTqukQPk2wmO5m9pFy0ciRve+awfgbTtZRZOEpTSWLbbpOfd4RQ5YqDWJ
mQIDAQAB
-----END PUBLIC KEY-----
`

const privateKey = `
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDbJR8cfpJFgq8F
N6at5+IeTgviqRxziySXhAJoc6R+ADhVwYobadfKxi5krsDM05wdBWL57gHA34F8
hm3ARTns6By1vl6DySzHEuNLt5JF9Ai88Z8BsnXZH06g5Zy578J1TL9gx5zhH+jj
61njlLpBBYgyEupiWPD6zVG6d1rcrxDyU50njIRlyRdpmvXBo0mKQLugalPsKUCB
1u9Yhug3XwbU6W5Gf7dY11w3pX68iPxz10az3ZuBM9fhyfdGYH/zQEN/N4WI8xHD
nFqrroXjbNfOWWROq6RA+TbCY7mb2kXLRyJG975rB+BtO1lFk4SlNJYttuk593hF
DlioNYmZAgMBAAECggEADvr6pXgBh77nN/QV8M1pJ6kuJtBooX1hgvoDMCC3neVl
9HbGehlCJxplEXzgsR/GDDXSDkO22vhsYZbO6dXRn+A+Fi5tR5T4+qLP5t0loqKL
9l6OAA+y/qSlO1p23D8Hi/0zF+qNTtZflTUBcA06rjcymDmyzAZIctyWOajvDSbK
Df0ZvKYPnwG5gjF01hPS2VJicv/O0HXLN7elq/jio1dwvLa2JjPyXhWBkHqnJBcq
ncWP9IEJQmhQ8ijNEg78uLtiNZQ4+GcXNBlwhM7JER6X/AxSxEZ/7fjZog685yUH
3iF820SnStOJQQci/RMMPOsK6cM7BiJxGp2W12EOAQKBgQD85UdCDro6zpblpAw7
Gw82SkWGksJXuGlTX+nj3/3iIiEb4ATCvZufYXALGNtiG0tPHDMBQCKLYrbLE1pt
9uIU/IbDFPeQk8rR/b7IHu0gv3463p6r7WVhzY2/JCororKYQk4zbuk3cNYtlV76
ojnNY1EFDLK/1nGT6QDxDA7Z5wKBgQDd1chB2qlbljRzYFwKrWXZ0COtbnEGPnUz
rLvSlAvYlZSKuB/vXkHGepxdlAjDGgX6xkKSl1TKb8UWQ9JSv0MPGBcMPukuwCAL
BOobyvd1mln6f/C7FrATkRbrG+r8RAQTwR+eknwYYOPAS/PpXm8gZvVntiahihFd
NqQtud8QfwKBgQDGV+xzWqmkxbKDmQ4erTJZGhc9XI0fz3qL8YW3O04btTjSa/hP
4/XSItGFYpFteIqwGSXHrU1qlJlY3GzoIeFfJE9tYVxpAADqgWDIA7lnHcka0s8P
eLky48xwRSTt5ES+NgKvRCWVXeIdDjHX0LQU6ff5ReRLoRyjLPOYGiTrsQKBgAmq
z1dPWCINoauFf31XoSCk2Wktbu9+uUzPMkAzA3Ek05xX+cxMp0EnBrltQhR+hdQv
36bTwXYw+L3HptrESv/VZOu7sh2/caYJSMp9RdtyJomsGamNi47Ou9jzFoJ31FWo
DOC0MYQ+dK5koPSCkQUwd3FVlsljYu5U+0Ki3v2xAoGASIMhNHOvz+Ay2otovVFN
gfRGTnepw8znHbkr10IG97BWd4VbFnHRdpYbtk8fH0UOyUVMrcY0B2/d73Rzqze3
iZ//FXIDTtmKnVS/ZhC2w0AH8Piziy3NW3G6jRZN6+9NpOf/BIc4pfzgUJ3RqHz/
IeONX+52k6gz1SCjPgSUlTs=
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
				w.Write([]byte(`{"key":"not really a key"}`))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusInternalServerError,
		},
		{
			"invalid key",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			nil,
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(`{"key":"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCATZAMIIBCgKCAQEA2yUfHH6SRYKvBTemrefi\nHk4L4qkcc4skl4QCaHOkfgA4VcGKG2nXysYuZK7AzNOcHQVi+e4BwN+BfIZtwEU5\n7Ogctb5eg8ksxxLjS7eSRfQIvPGfAbJ12R9OoOWcue/CdUy/YMec4R/o4+tZ45S6\nQQWIMhLqYljw+s1Runda3K8Q8lOdJ4yEZckXaZr1waNJikC7oGpT7ClAgdbvWIbo\nN18G1OluRn+3WNdcN6V+vIj8c9dGs92bgTPX4cn3RmB/80BDfzeFiPMRw5xaq66F\n42zXzllkTqukQPk2wmO5m9pFy0ciRve+awfgbTtZRZOEpTSWLbbpOfd4RQ5YqDWJ\nmQIDAQAB\n-----END PUBLIC KEY-----"}`))
			})),
			func(r *http.Request, claims map[string]interface{}) error { return nil },
			http.StatusBadGateway,
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
					fmt.Sprintf(`{"key":"%s"}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
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
					fmt.Sprintf(`{"key":"%s"}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
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
					fmt.Sprintf(`{"key":"%s"}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
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
					fmt.Sprintf(`{"key":"%s"}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
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
					fmt.Sprintf(`{"key":"%s"}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
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
					fmt.Sprintf(`{"key":"%s"}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
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
