// Copyright 2020 - Offen Authors <hioffen@posteo.de>
// SPDX-License-Identifier: Apache-2.0

package router

import (
	"errors"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/persistence"
)

func TestRouter_postLogout(t *testing.T) {
	m := gin.New()
	rt := router{
		config: &config.Config{},
	}
	m.POST("/", rt.postLogout)
	r := httptest.NewRequest(http.MethodPost, "/", nil)
	w := httptest.NewRecorder()
	r.AddCookie(&http.Cookie{
		Name:    "auth",
		Value:   "abc123xyz",
		Expires: time.Now().Add(time.Hour),
	})

	m.ServeHTTP(w, r)
	cookies := w.Result().Cookies()
	if len(cookies) != 1 {
		t.Errorf("Unexpected additional cookies in response: %v", cookies)
	}
	authCookie := cookies[0]
	if authCookie.Name != "auth" {
		t.Errorf("Unexpected cookie name %v", authCookie.Name)
	}
	if authCookie.Value != "" {
		t.Errorf("Unexpected non-empty cookie value %v", authCookie.Value)
	}
	if authCookie.Expires.After(time.Now()) {
		t.Errorf("Unexpected future expiry %v", authCookie.Expires)
	}
}

type mockPostLoginDatabase struct {
	persistence.Service
	result persistence.LoginResult
	err    error
}

func (m *mockPostLoginDatabase) Login(string, string) (persistence.LoginResult, error) {
	return m.result, m.err
}
func TestRouter_postLogin(t *testing.T) {
	tests := []struct {
		name               string
		db                 mockPostLoginDatabase
		body               io.Reader
		expectedStatusCode int
		expectCookie       bool
	}{
		{
			"bad payload",
			mockPostLoginDatabase{},
			strings.NewReader("{{88+++#"),
			http.StatusBadRequest,
			false,
		},
		{
			"bad login",
			mockPostLoginDatabase{
				err: errors.New("bad login"),
			},
			strings.NewReader(`{"username":"mail@offen.dev","password":"secret!"}`),
			http.StatusUnauthorized,
			false,
		},
		{
			"ok",
			mockPostLoginDatabase{
				result: persistence.LoginResult{
					AccountUserID: "user-a",
				},
			},
			strings.NewReader(`{"username":"mail@offen.dev","password":"secret!"}`),
			http.StatusOK,
			true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			m := gin.New()
			rt := router{
				config:       &config.Config{},
				db:           &test.db,
				cookieSigner: securecookie.New([]byte("abc"), nil),
			}
			m.POST("/", rt.postLogin)
			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			w := httptest.NewRecorder()
			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}

			cookies := w.Result().Cookies()
			if test.expectCookie {
				if len(cookies) != 1 {
					t.Errorf("Expected 1 cookie in response, received %v", len(cookies))
				}
				authCookie := cookies[0]
				if authCookie.Name != "auth" {
					t.Errorf("Unexpected cookie name %v", authCookie.Name)
				}
				if !authCookie.Expires.IsZero() {
					t.Errorf("Expected session cookie, got %v", authCookie.Expires)
				}
			} else {
				if len(cookies) != 0 {
					t.Errorf("Expected no cookie in response, received %v", len(cookies))
				}
			}
		})
	}
}

func TestRouter_getLogin(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		m := gin.New()
		rt := router{
			config: &config.Config{},
		}
		m.GET("/", func(c *gin.Context) {
			c.Set(contextKeyAuth, persistence.LoginResult{})
		}, rt.getLogin)
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		m.ServeHTTP(w, r)
		if w.Code != http.StatusOK {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})
	t.Run("not ok", func(t *testing.T) {
		m := gin.New()
		rt := router{
			config: &config.Config{},
		}
		m.GET("/", rt.getLogin)
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		w := httptest.NewRecorder()
		m.ServeHTTP(w, r)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("Unexpected status code %v", w.Code)
		}
	})
}

type mockPostChangePasswordDatabase struct {
	persistence.Service
	err error
}

func (m *mockPostChangePasswordDatabase) ChangePassword(string, string, string) error {
	return m.err
}

func TestRouter_postChangePassword(t *testing.T) {
	tests := []struct {
		name                string
		db                  mockPostChangePasswordDatabase
		body                io.Reader
		userContext         interface{}
		expectedStatus      int
		expectClearedCookie bool
	}{
		{
			"no user context",
			mockPostChangePasswordDatabase{},
			strings.NewReader(`{"currentPassword":"secret","changedPassword":"update"}`),
			nil,
			http.StatusInternalServerError,
			false,
		},
		{
			"bad payload",
			mockPostChangePasswordDatabase{},
			strings.NewReader("88kao122ä#"),
			persistence.LoginResult{
				AccountUserID: "account-user",
			},
			http.StatusBadRequest,
			false,
		},
		{
			"database error",
			mockPostChangePasswordDatabase{
				err: errors.New("did not work"),
			},
			strings.NewReader(`{"currentPassword":"secret","changedPassword":"update"}`),
			persistence.LoginResult{
				AccountUserID: "account-user",
			},
			http.StatusBadRequest,
			false,
		},
		{
			"ok",
			mockPostChangePasswordDatabase{},
			strings.NewReader(`{"currentPassword":"secret","changedPassword":"update"}`),
			persistence.LoginResult{
				AccountUserID: "account-user",
			},
			http.StatusNoContent,
			true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			m := gin.New()
			rt := router{
				config: &config.Config{},
				db:     &test.db,
			}
			m.POST("/", func(c *gin.Context) {
				c.Set(contextKeyAuth, test.userContext)
			}, rt.postChangePassword)
			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			w := httptest.NewRecorder()
			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatus {
				t.Errorf("Unexpected status code %v", w.Code)
			}

			cookies := w.Result().Cookies()
			if test.expectClearedCookie {
				authCookie := cookies[0]
				if authCookie.Name != "auth" {
					t.Errorf("Unexpected cookie name %v", authCookie.Name)
				}
				if authCookie.Value != "" {
					t.Errorf("Unexpected non-empty cookie value %v", authCookie.Value)
				}

			} else {
				if len(cookies) != 0 {
					t.Errorf("Unexpected cookie values in response %v", cookies)
				}
			}
		})
	}
}

type mockPostChangeEmailDatabase struct {
	persistence.Service
	err error
}

func (m *mockPostChangeEmailDatabase) ChangeEmail(string, string, string, string) error {
	return m.err
}

func TestRouter_postChangeEmail(t *testing.T) {
	tests := []struct {
		name                string
		db                  mockPostChangeEmailDatabase
		body                io.Reader
		userContext         interface{}
		expectedStatus      int
		expectClearedCookie bool
	}{
		{
			"bad user context",
			mockPostChangeEmailDatabase{},
			strings.NewReader(`{"emailAddress":"new@me.net","emailCurrent":"old@me.net","password":"secret-sauce"}`),
			1999,
			http.StatusInternalServerError,
			false,
		},
		{
			"bad payload",
			mockPostChangeEmailDatabase{},
			strings.NewReader("891ä##"),
			persistence.LoginResult{
				AccountUserID: "account-user",
			},
			http.StatusBadRequest,
			false,
		},
		{
			"db error",
			mockPostChangeEmailDatabase{
				err: errors.New("did not work"),
			},
			strings.NewReader(`{"emailAddress":"new@me.net","emailCurrent":"old@me.net","password":"secret-sauce"}`),
			persistence.LoginResult{
				AccountUserID: "account-user",
			},
			http.StatusBadRequest,
			false,
		},
		{
			"ok",
			mockPostChangeEmailDatabase{},
			strings.NewReader(`{"emailAddress":"new@me.net","emailCurrent":"old@me.net","password":"secret-sauce"}`),
			persistence.LoginResult{
				AccountUserID: "account-user",
			},
			http.StatusNoContent,
			true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			m := gin.New()
			rt := router{
				config: &config.Config{},
				db:     &test.db,
			}
			m.POST("/", func(c *gin.Context) {
				c.Set(contextKeyAuth, test.userContext)
			}, rt.postChangeEmail)
			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			w := httptest.NewRecorder()
			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatus {
				t.Errorf("Unexpected status code %v", w.Code)
			}

			cookies := w.Result().Cookies()
			if test.expectClearedCookie {
				authCookie := cookies[0]
				if authCookie.Name != "auth" {
					t.Errorf("Unexpected cookie name %v", authCookie.Name)
				}
				if authCookie.Value != "" {
					t.Errorf("Unexpected non-empty cookie value %v", authCookie.Value)
				}

			} else {
				if len(cookies) != 0 {
					t.Errorf("Unexpected cookie values in response %v", cookies)
				}
			}
		})
	}
}

type mockPostResetPasswordDatabase struct {
	persistence.Service
	err error
}

func (m *mockPostResetPasswordDatabase) ResetPassword(string, string, []byte) error {
	return m.err
}

func TestRouter_postResetPassword(t *testing.T) {
	signer := securecookie.New([]byte("abc"), nil)
	tests := []struct {
		name               string
		body               io.Reader
		db                 mockPostResetPasswordDatabase
		expectedStatusCode int
	}{
		{
			"bad payload",
			strings.NewReader(",,,....##äö"),
			mockPostResetPasswordDatabase{},
			http.StatusBadRequest,
		},
		{
			"bad token",
			strings.NewReader(`{"emailAddress":"hioffen@posteo.de","password":"new","token":"made up token"}`),
			mockPostResetPasswordDatabase{},
			http.StatusBadRequest,
		},
		{
			"token mismatch",
			func() io.Reader {
				s, _ := signer.Encode("credentials", &forgotPasswordCredentials{
					EmailAddress: "mail@offen.dev",
				})
				return strings.NewReader(
					fmt.Sprintf(
						`{"emailAddress":"hioffen@posteo.de","password":"new","token":"%s"}`, s,
					),
				)
			}(),
			mockPostResetPasswordDatabase{},
			http.StatusBadRequest,
		},
		{
			"db error",
			func() io.Reader {
				s, _ := signer.Encode("credentials", &forgotPasswordCredentials{
					EmailAddress: "hioffen@posteo.de",
				})
				return strings.NewReader(
					fmt.Sprintf(
						`{"emailAddress":"hioffen@posteo.de","password":"new","token":"%s"}`, s,
					),
				)
			}(),
			mockPostResetPasswordDatabase{
				err: errors.New("did not work"),
			},
			http.StatusNoContent,
		},
		{
			"ok",
			func() io.Reader {
				s, _ := signer.Encode("credentials", &forgotPasswordCredentials{
					EmailAddress: "hioffen@posteo.de",
				})
				return strings.NewReader(
					fmt.Sprintf(
						`{"emailAddress":"hioffen@posteo.de","password":"new","token":"%s"}`, s,
					),
				)
			}(),
			mockPostResetPasswordDatabase{},
			http.StatusNoContent,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			m := gin.New()
			rt := router{
				config:       &config.Config{},
				db:           &test.db,
				cookieSigner: signer,
			}
			m.POST("/", rt.postResetPassword)
			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			w := httptest.NewRecorder()
			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
		})
	}
}

type mockPostForgotPasswordDatabase struct {
	persistence.Service
	result []byte
	err    error
}

func (m *mockPostForgotPasswordDatabase) GenerateOneTimeKey(string) ([]byte, error) {
	return m.result, m.err
}

type mockMailer struct {
	err error
}

func (m *mockMailer) Send(from, to, subject, body string) error {
	return m.err
}

func TestRouter_postForgotPassword(t *testing.T) {
	tests := []struct {
		name           string
		db             mockPostForgotPasswordDatabase
		mailer         mockMailer
		body           io.Reader
		expectedStatus int
	}{
		{
			"bad payload",
			mockPostForgotPasswordDatabase{},
			mockMailer{},
			strings.NewReader(`{]%%&(!)`),
			http.StatusBadRequest,
		},
		{
			"key error",
			mockPostForgotPasswordDatabase{
				err: errors.New("did not work"),
			},
			mockMailer{},
			strings.NewReader(`{"emailAddress":"mail@offen.dev","urlTemplate":"/{token}/"}`),
			http.StatusNoContent,
		},
		{
			"error sending email",
			mockPostForgotPasswordDatabase{
				result: []byte("i'm a token"),
			},
			mockMailer{
				err: errors.New("did not work"),
			},
			strings.NewReader(`{"emailAddress":"mail@offen.dev","urlTemplate":"/reset/{token}/"}`),
			http.StatusInternalServerError,
		},
		{
			"ok",
			mockPostForgotPasswordDatabase{
				result: []byte("i'm a token"),
			},
			mockMailer{},
			strings.NewReader(`{"emailAddress":"mail@offen.dev","urlTemplate":"/reset/{token}/"}`),
			http.StatusNoContent,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			m := gin.New()
			rt := router{
				config:       &config.Config{},
				db:           &test.db,
				cookieSigner: securecookie.New([]byte("abc"), nil),
				mailer:       &test.mailer,
				emails: func() *template.Template {
					t := template.New("emails")
					t, _ = t.Parse(`
{{ define "subject_reset_password" }}subject{{ end }}
{{ define "body_reset_password" }}body{{ end }}
					`)
					return t
				}(),
			}
			m.POST("/", rt.postForgotPassword)
			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			w := httptest.NewRecorder()
			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatus {
				t.Errorf("Unexpected status code %v", w.Body)
			}
		})
	}
}
