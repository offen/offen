package http

import (
	"crypto/x509"
	"encoding/pem"
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
		server             *httptest.Server
		expectedStatusCode int
	}{
		{
			"no cookie",
			nil,
			nil,
			http.StatusForbidden,
		},
		{
			"bad server",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			nil,
			http.StatusInternalServerError,
		},
		{
			"non-json response",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("here's some bytes 4 y'all"))
			})),
			http.StatusInternalServerError,
		},
		{
			"bad key value",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(`{"key":"not really a key"}`))
			})),
			http.StatusInternalServerError,
		},
		{
			"invalid key",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(`{"key":"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCATZAMIIBCgKCAQEA2yUfHH6SRYKvBTemrefi\nHk4L4qkcc4skl4QCaHOkfgA4VcGKG2nXysYuZK7AzNOcHQVi+e4BwN+BfIZtwEU5\n7Ogctb5eg8ksxxLjS7eSRfQIvPGfAbJ12R9OoOWcue/CdUy/YMec4R/o4+tZ45S6\nQQWIMhLqYljw+s1Runda3K8Q8lOdJ4yEZckXaZr1waNJikC7oGpT7ClAgdbvWIbo\nN18G1OluRn+3WNdcN6V+vIj8c9dGs92bgTPX4cn3RmB/80BDfzeFiPMRw5xaq66F\n42zXzllkTqukQPk2wmO5m9pFy0ciRve+awfgbTtZRZOEpTSWLbbpOfd4RQ5YqDWJ\nmQIDAQAB\n-----END PUBLIC KEY-----"}`))
			})),
			http.StatusBadGateway,
		},
		{
			"valid key, bad auth token",
			&http.Cookie{
				Name:  "auth",
				Value: "irrelevantgibberish",
			},
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(
					fmt.Sprintf(`{"key":"%s"}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
				))
			})),
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
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(
					fmt.Sprintf(`{"key":"%s"}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
				))
			})),
			http.StatusOK,
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
			httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte(
					fmt.Sprintf(`{"key":"%s"}`, strings.ReplaceAll(publicKey, "\n", `\n`)),
				))
			})),
			http.StatusForbidden,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var url string
			if test.server != nil {
				url = test.server.URL
			}
			wrappedHandler := JWTProtect(url, "auth")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write([]byte("OK"))
			}))
			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			if test.cookie != nil {
				r.AddCookie(test.cookie)
			}
			wrappedHandler.ServeHTTP(w, r)
			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
		})
	}
}
