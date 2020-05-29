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

	"github.com/gin-gonic/gin"
	"github.com/gorilla/securecookie"
	"github.com/offen/offen/server/config"
	"github.com/offen/offen/server/persistence"
)

type mockPostShareAccountDatabase struct {
	persistence.Service
	shareAccountResult persistence.ShareAccountResult
	shareAccountErr    error
	loginResult        persistence.LoginResult
	loginErr           error
}

func (m *mockPostShareAccountDatabase) ShareAccount(string, string, string, string, bool) (persistence.ShareAccountResult, error) {
	return m.shareAccountResult, m.shareAccountErr
}

func (m *mockPostShareAccountDatabase) Login(string, string) (persistence.LoginResult, error) {
	return m.loginResult, m.loginErr
}

func TestRouter_postShareAccount(t *testing.T) {
	signer := securecookie.New([]byte("ABC"), nil)
	tests := []struct {
		name               string
		accountID          string
		db                 mockPostShareAccountDatabase
		userContext        interface{}
		body               io.Reader
		mailer             mockMailer
		expectedStatusCode int
	}{
		{
			"bad payload",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-user-id",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader("xx8190"),
			mockMailer{},
			http.StatusBadRequest,
		},
		{
			"bad user context",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-user-id",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
			},
			"oingo-boingo",
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{},
			http.StatusBadRequest,
		},
		{
			"account mismatch",
			"account-b-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-user-id",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{},
			http.StatusUnauthorized,
		},
		{
			"bad login",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginErr: errors.New("did not work"),
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{},
			http.StatusUnauthorized,
		},
		{
			"credential mismatch",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "other-account-user-id",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{},
			http.StatusBadRequest,
		},
		{
			"requester is not super admin",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-user-id",
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{},
			http.StatusBadRequest,
		},
		{
			"share error",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-user-id",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
				shareAccountErr: errors.New("did not work"),
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{},
			http.StatusBadRequest,
		},
		{
			"noop",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-user-id",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
				shareAccountResult: persistence.ShareAccountResult{
					UserExistsWithPassword: true,
					AccountNames:           []string{},
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{},
			http.StatusBadRequest,
		},
		{
			"ok user exists",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-user-id",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
				shareAccountResult: persistence.ShareAccountResult{
					UserExistsWithPassword: true,
					AccountNames:           []string{"Account A"},
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{},
			http.StatusNoContent,
		},
		{
			"ok user does not exist",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-user-id",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
				shareAccountResult: persistence.ShareAccountResult{
					UserExistsWithPassword: false,
					AccountNames:           []string{"Account A"},
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{},
			http.StatusNoContent,
		},
		{
			"mailer error",
			"account-a-id",
			mockPostShareAccountDatabase{
				loginResult: persistence.LoginResult{
					AccountUserID: "account-user-id",
					AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
					Accounts: []persistence.LoginAccountResult{
						{AccountID: "account-a-id"},
					},
				},
				shareAccountResult: persistence.ShareAccountResult{
					UserExistsWithPassword: false,
					AccountNames:           []string{"Account A"},
				},
			},
			persistence.LoginResult{
				AccountUserID: "account-user-id",
				AdminLevel:    persistence.AccountUserAdminLevelSuperAdmin,
				Accounts: []persistence.LoginAccountResult{
					{AccountID: "account-a-id"},
				},
			},
			strings.NewReader(`{"invitee":"mail@offen.dev","emailAddress":"hioffen@posteo.de","password":"ok","urlTemplate":"/join/{token}","grantAdminPrivileges":false}`),
			mockMailer{
				err: errors.New("did not work"),
			},
			http.StatusInternalServerError,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{
				config:       &config.Config{},
				db:           &test.db,
				authenticationSigner: signer,
				mailer:       &test.mailer,
				emails: func() *template.Template {
					t := template.New("emails")
					t, _ = t.Parse(`
{{ define "subject_existing_user_invite" }}subject{{ end }}
{{ define "body_existing_user_invite" }}body{{ end }}
{{ define "subject_new_user_invite" }}subject{{ end }}
{{ define "body_new_user_invite" }}body{{ end }}
					`)
					return t
				}(),
			}

			m := gin.New()
			m.POST("/:accountID", func(c *gin.Context) {
				c.Set(contextKeyAuth, test.userContext)
			}, rt.postShareAccount)

			r := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/%s", test.accountID), test.body)
			w := httptest.NewRecorder()
			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
		})
	}
}

type mockPostJoinDatabase struct {
	persistence.Service
	err error
}

func (m *mockPostJoinDatabase) Join(string, string) error {
	return m.err
}

func TestRouter_postJoin(t *testing.T) {
	signer := securecookie.New([]byte("abc"), nil)
	tests := []struct {
		name               string
		db                 mockPostJoinDatabase
		body               io.Reader
		expectedStatusCode int
	}{
		{
			"bad payload",
			mockPostJoinDatabase{},
			strings.NewReader("xxx"),
			http.StatusBadRequest,
		},
		{
			"bad token",
			mockPostJoinDatabase{},
			strings.NewReader(`{"emailAddress":"hioffen@posteo.de","password":"pass","token":"something something"}`),
			http.StatusBadRequest,
		},
		{
			"email mismatch",
			mockPostJoinDatabase{},
			func() io.Reader {
				token, _ := signer.Encode("credentials", "mail@offen.dev")
				return strings.NewReader(
					fmt.Sprintf(
						`{"emailAddress":"hioffen@posteo.de","password":"pass","token":"%s"}`,
						token,
					),
				)
			}(),
			http.StatusBadRequest,
		},
		{
			"database error",
			mockPostJoinDatabase{
				err: errors.New("did not work"),
			},
			func() io.Reader {
				token, _ := signer.Encode("credentials", "hioffen@posteo.de")
				return strings.NewReader(
					fmt.Sprintf(
						`{"emailAddress":"hioffen@posteo.de","password":"pass","token":"%s"}`,
						token,
					),
				)
			}(),
			http.StatusNoContent,
		},
		{
			"ok",
			mockPostJoinDatabase{},
			func() io.Reader {
				token, _ := signer.Encode("credentials", "hioffen@posteo.de")
				return strings.NewReader(
					fmt.Sprintf(
						`{"emailAddress":"hioffen@posteo.de","password":"pass","token":"%s"}`,
						token,
					),
				)
			}(),
			http.StatusNoContent,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{
				db:           &test.db,
				authenticationSigner: signer,
			}

			m := gin.New()
			m.POST("/", rt.postJoin)

			r := httptest.NewRequest(http.MethodPost, "/", test.body)
			w := httptest.NewRecorder()
			m.ServeHTTP(w, r)

			if w.Code != test.expectedStatusCode {
				t.Errorf("Unexpected status code %v", w.Code)
			}
		})
	}
}
