package router

import (
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/offen/offen/kms/keymanager"
)

type mockEncryptionKeyManager struct {
	keymanager.Manager
	err error
}

func (m *mockEncryptionKeyManager) Encrypt(b []byte) ([]byte, error) {
	if m.err != nil {
		return nil, m.err
	}
	// this reverses the bytes
	for i := len(b)/2 - 1; i >= 0; i-- {
		opp := len(b) - 1 - i
		b[i], b[opp] = b[opp], b[i]
	}
	return b, nil
}

func TestRouter_HandleEncrypt(t *testing.T) {
	tests := []struct {
		name               string
		manager            *mockEncryptionKeyManager
		body               string
		expectedStatusCode int
		expectedBody       string
	}{
		{
			"bad payload",
			&mockEncryptionKeyManager{},
			"just a string",
			http.StatusBadRequest,
			`{"error":"invalid character 'j' looking for beginning of value","status":400}`,
		},
		{
			"non-string decrypted value",
			&mockEncryptionKeyManager{},
			`{"decrypted":100}`,
			http.StatusBadRequest,
			`{"error":"expected .decrypted to be a non-empty string","status":400}`,
		},
		{
			"encryption error",
			&mockEncryptionKeyManager{
				err: errors.New("upstream problems and such"),
			},
			`{"decrypted":"abc123"}`,
			http.StatusBadRequest,
			`{"error":"upstream problems and such","status":400}`,
		},
		{
			"ok",
			&mockEncryptionKeyManager{},
			`{"decrypted":"abc123"}`,
			http.StatusOK,
			`{"encrypted":"MzIxY2Jh"}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{manager: test.manager}

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(test.body))

			rt.handleEncrypt(w, r)

			if w.Code != test.expectedStatusCode {
				t.Errorf("Expected status code %v, got %v", test.expectedStatusCode, w.Code)
			}

			if w.Body.String() != test.expectedBody {
				t.Errorf("Expected body %s, got %s", test.expectedBody, w.Body.String())
			}
		})
	}
}

type mockDecryptionManager struct {
	keymanager.Manager
	err    error
	result string
}

func (m *mockDecryptionManager) Decrypt(b []byte) ([]byte, error) {
	if m.err != nil {
		return nil, m.err
	}
	if m.result != "" {
		return []byte(m.result), nil
	}
	// this reverses the bytes
	for i := len(b)/2 - 1; i >= 0; i-- {
		opp := len(b) - 1 - i
		b[i], b[opp] = b[opp], b[i]
	}
	return b, nil
}
func TestRouter_HandleDecrypt(t *testing.T) {
	tests := []struct {
		name               string
		manager            *mockDecryptionManager
		body               string
		query              string
		expectedStatusCode int
		expectedBody       string
	}{
		{
			"bad payload",
			&mockDecryptionManager{},
			"just a string",
			"",
			http.StatusBadRequest,
			`{"error":"invalid character 'j' looking for beginning of value","status":400}`,
		},
		{
			"decryption error",
			&mockDecryptionManager{
				err: errors.New("did not work"),
			},
			`{"encrypted":"c29tZXZhbHVl"}`,
			"",
			http.StatusInternalServerError,
			`{"error":"did not work","status":500}`,
		},
		{
			"successful decryption",
			&mockDecryptionManager{},
			`{"encrypted":"c29tZXZhbHVl"}`, // base64 encoded string "somevalue"
			"",
			http.StatusOK,
			`{"decrypted":"eulavemos"}`,
		},
		{
			"as jwk - bad key",
			&mockDecryptionManager{},
			`{"encrypted":"c29tZXZhbHVl"}`, // base64 encoded string "somevalue"
			"?jwk=1",
			http.StatusInternalServerError,
			`{"error":"error decoding decrypted key in PEM format","status":500}`,
		},
		{
			"as jwk - successful",
			&mockDecryptionManager{
				result: `
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAvSEKpVFnSSV/Knr8g/AQYt46xEMVweKLH/ynEpoOAZVnS43Z
kq7pEoWydFAW3+iKALxEiCU6z4VTcOVG2hQCeJ3GisjZXJIffov9ND4rzido9Lja
mWXU53kjt5coAbcwmbDDQ/r/V5bs2NzeNq7VCx6V4VfyWK6ZA+XiTiEnph77lT0l
Xdt5UWhHPQpDbq7GT04vqdVBPJ+cg11Otondhr0hf4CtcSQ9sGg5yIx3FpTileBv
iBAJLFgkKcgtnTJjMZSHddH1m0fNHw5vvLUM9UnzV+eE0kawgr/fUS6UgEZ0iV+C
jFY9aOxHLep224UtIckh44xTcsCXxZ4G1M0vmwIDAQABAoIBAG+T9rvhcpXs0UE2
nZMZJhGuGe1/xm5EQN/2JnsK+AhnJDGm1h17o3WR+t40AcrHXeNhLu1DSZb0iW2p
VkuCUpLmQiPOqq26Z2o5HICdzSoqhfkatZyaPyjwhung+3FHqhyB9DE++zWpjMHE
TDTmoDmXKcVwJUG8f/mUvhZp6QJPcGBlWnOuboogPIsfNaeuxmpI0jmay8Cl0KVI
0I+jgbwRTdW7CbOwp2ntqwnXXMkWrQQ0aukSVGUW1+xt+xUzvm1khcTKujn/26NN
JJowoy0mf7B3/gYeXsuVU/YIVozitMyws4YdhUM1W2VA8Ew3LUriqgaMdX9oEA7O
tx4gwsECgYEA8LCarUzHhOAd05f+TvThR/SM/mjsBnbIeWbJnRxZrGqGZqj4eOzl
R1d1G0fn9qYn6FkJbq9rlo/pyx+SPPZfO4PrD3Z1BBMVjMxQhKhoqphtcH38XcN1
PkeNigzLWvM8qMoeYEnnICqzyN900Lto7AUuNLVukE89eQJNGoBGns8CgYEAySjS
LOWIDG8TAHeuJDVWU1YmweVz+SyXFr/ReFbxhSzTc/i+jiYaqGmnf89kT+qaR1d5
ToQEEuZNNXnUo495IudTbQYxWzoorfLPPWXWEYvjDBnoTV36W92FEu1vzRak01Nf
bkcxwOm3rn27en9nx0TcroJ0BbID8dpCh39udXUCgYAod9kZ6D3npnL9X6HfjqbO
HV0TbXq5v4EHgHPHmbuuFJ8SZbiZRGNsclT7SETFILy3ATlnxdDWGM5bW6yP2XC7
pfuAtw8Hp1nJOZUUKOioPkawUk57SWDOHuO6YVpTqW/6hTlEQUi+DM/7py6R5eDH
Rju1mwfC9b/FN9DU8tps2wKBgAmSzsXiOqJU2vOnvnrsquoWbIvHzsgqDhrAEEkI
4j+zTXD0gqUjPRuMw7L6fMys3qDMkfJhqAv6N+x2mt8Z4er+VWMX61trHiqBJsnG
QfTd0nVt+jdMZLDgjwfCkxKQpFGGY0FNVBnZRauhQj3nOFosddA8Vyc6PKPS/l2S
fABNAoGBAN/peT9ENppo9FQg7bkcfExaSAtlt8xfgU+ufiOJW5COFeVX4mhX79CU
kKB/ghAnnkuqfcJsCidjSy816blbGqFqzu9tGgE420toESra+z+9LiMj2ek8tEw6
8qjqWHo00DoNOrgjRdoHq3Rd7zw9fCfjhuc30KB0Y3PQbnkssCB4
-----END RSA PRIVATE KEY-----`,
			},
			`{"encrypted":"LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb3dJQkFBS0NBUUVBdlNFS3BWRm5TU1YvS25yOGcvQVFZdDQ2eEVNVndlS0xIL3luRXBvT0FaVm5TNDNaCmtxN3BFb1d5ZEZBVzMraUtBTHhFaUNVNno0VlRjT1ZHMmhRQ2VKM0dpc2paWEpJZmZvdjlORDRyemlkbzlMamEKbVdYVTUza2p0NWNvQWJjd21iRERRL3IvVjViczJOemVOcTdWQ3g2VjRWZnlXSzZaQStYaVRpRW5waDc3bFQwbApYZHQ1VVdoSFBRcERicTdHVDA0dnFkVkJQSitjZzExT3RvbmRocjBoZjRDdGNTUTlzR2c1eUl4M0ZwVGlsZUJ2CmlCQUpMRmdrS2NndG5USmpNWlNIZGRIMW0wZk5IdzV2dkxVTTlVbnpWK2VFMGthd2dyL2ZVUzZVZ0VaMGlWK0MKakZZOWFPeEhMZXAyMjRVdElja2g0NHhUY3NDWHhaNEcxTTB2bXdJREFRQUJBb0lCQUcrVDlydmhjcFhzMFVFMgpuWk1aSmhHdUdlMS94bTVFUU4vMkpuc0srQWhuSkRHbTFoMTdvM1dSK3Q0MEFjckhYZU5oTHUxRFNaYjBpVzJwClZrdUNVcExtUWlQT3FxMjZaMm81SElDZHpTb3FoZmthdFp5YVB5andodW5nKzNGSHFoeUI5REUrK3pXcGpNSEUKVERUbW9EbVhLY1Z3SlVHOGYvbVV2aFpwNlFKUGNHQmxXbk91Ym9vZ1BJc2ZOYWV1eG1wSTBqbWF5OENsMEtWSQowSStqZ2J3UlRkVzdDYk93cDJudHF3blhYTWtXclFRMGF1a1NWR1VXMSt4dCt4VXp2bTFraGNUS3Vqbi8yNk5OCkpKb3dveTBtZjdCMy9nWWVYc3VWVS9ZSVZveml0TXl3czRZZGhVTTFXMlZBOEV3M0xVcmlxZ2FNZFg5b0VBN08KdHg0Z3dzRUNnWUVBOExDYXJVekhoT0FkMDVmK1R2VGhSL1NNL21qc0JuYkllV2JKblJ4WnJHcUdacWo0ZU96bApSMWQxRzBmbjlxWW42RmtKYnE5cmxvL3B5eCtTUFBaZk80UHJEM1oxQkJNVmpNeFFoS2hvcXBodGNIMzhYY04xClBrZU5pZ3pMV3ZNOHFNb2VZRW5uSUNxenlOOTAwTHRvN0FVdU5MVnVrRTg5ZVFKTkdvQkduczhDZ1lFQXlTalMKTE9XSURHOFRBSGV1SkRWV1UxWW13ZVZ6K1N5WEZyL1JlRmJ4aFN6VGMvaStqaVlhcUdtbmY4OWtUK3FhUjFkNQpUb1FFRXVaTk5YblVvNDk1SXVkVGJRWXhXem9vcmZMUFBXWFdFWXZqREJub1RWMzZXOTJGRXUxdnpSYWswMU5mCmJrY3h3T20zcm4yN2VuOW54MFRjcm9KMEJiSUQ4ZHBDaDM5dWRYVUNnWUFvZDlrWjZEM25wbkw5WDZIZmpxYk8KSFYwVGJYcTV2NEVIZ0hQSG1idXVGSjhTWmJpWlJHTnNjbFQ3U0VURklMeTNBVGxueGREV0dNNWJXNnlQMlhDNwpwZnVBdHc4SHAxbkpPWlVVS09pb1BrYXdVazU3U1dET0h1TzZZVnBUcVcvNmhUbEVRVWkrRE0vN3B5NlI1ZURIClJqdTFtd2ZDOWIvRk45RFU4dHBzMndLQmdBbVN6c1hpT3FKVTJ2T252bnJzcXVvV2JJdkh6c2dxRGhyQUVFa0kKNGorelRYRDBncVVqUFJ1TXc3TDZmTXlzM3FETWtmSmhxQXY2Tit4Mm10OFo0ZXIrVldNWDYxdHJIaXFCSnNuRwpRZlRkMG5WdCtqZE1aTERnandmQ2t4S1FwRkdHWTBGTlZCblpSYXVoUWozbk9Gb3NkZEE4VnljNlBLUFMvbDJTCmZBQk5Bb0dCQU4vcGVUOUVOcHBvOUZRZzdia2NmRXhhU0F0bHQ4eGZnVSt1ZmlPSlc1Q09GZVZYNG1oWDc5Q1UKa0tCL2doQW5ua3VxZmNKc0NpZGpTeTgxNmJsYkdxRnF6dTl0R2dFNDIwdG9FU3JhK3orOUxpTWoyZWs4dEV3Ngo4cWpxV0hvMDBEb05PcmdqUmRvSHEzUmQ3enc5ZkNmamh1YzMwS0IwWTNQUWJua3NzQ0I0Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg=="}`, // base64 encoded string "somevalue"
			"?jwk=1",
			http.StatusOK,
			`{"decrypted":{"d":"b5P2u-FylezRQTadkxkmEa4Z7X_GbkRA3_Ymewr4CGckMabWHXujdZH63jQBysdd42Eu7UNJlvSJbalWS4JSkuZCI86qrbpnajkcgJ3NKiqF-Rq1nJo_KPCG6eD7cUeqHIH0MT77NamMwcRMNOagOZcpxXAlQbx_-ZS-FmnpAk9wYGVac65uiiA8ix81p67GakjSOZrLwKXQpUjQj6OBvBFN1bsJs7Cnae2rCddcyRatBDRq6RJUZRbX7G37FTO-bWSFxMq6Of_bo00kmjCjLSZ_sHf-Bh5ey5VT9ghWjOK0zLCzhh2FQzVbZUDwTDctSuKqBox1f2gQDs63HiDCwQ","dp":"KHfZGeg956Zy_V-h346mzh1dE216ub-BB4Bzx5m7rhSfEmW4mURjbHJU-0hExSC8twE5Z8XQ1hjOW1usj9lwu6X7gLcPB6dZyTmVFCjoqD5GsFJOe0lgzh7jumFaU6lv-oU5REFIvgzP-6cukeXgx0Y7tZsHwvW_xTfQ1PLabNs","dq":"CZLOxeI6olTa86e-euyq6hZsi8fOyCoOGsAQSQjiP7NNcPSCpSM9G4zDsvp8zKzeoMyR8mGoC_o37Haa3xnh6v5VYxfrW2seKoEmycZB9N3SdW36N0xksOCPB8KTEpCkUYZjQU1UGdlFq6FCPec4Wix10DxXJzo8o9L-XZJ8AE0","e":"AQAB","kty":"RSA","n":"vSEKpVFnSSV_Knr8g_AQYt46xEMVweKLH_ynEpoOAZVnS43Zkq7pEoWydFAW3-iKALxEiCU6z4VTcOVG2hQCeJ3GisjZXJIffov9ND4rzido9LjamWXU53kjt5coAbcwmbDDQ_r_V5bs2NzeNq7VCx6V4VfyWK6ZA-XiTiEnph77lT0lXdt5UWhHPQpDbq7GT04vqdVBPJ-cg11Otondhr0hf4CtcSQ9sGg5yIx3FpTileBviBAJLFgkKcgtnTJjMZSHddH1m0fNHw5vvLUM9UnzV-eE0kawgr_fUS6UgEZ0iV-CjFY9aOxHLep224UtIckh44xTcsCXxZ4G1M0vmw","p":"8LCarUzHhOAd05f-TvThR_SM_mjsBnbIeWbJnRxZrGqGZqj4eOzlR1d1G0fn9qYn6FkJbq9rlo_pyx-SPPZfO4PrD3Z1BBMVjMxQhKhoqphtcH38XcN1PkeNigzLWvM8qMoeYEnnICqzyN900Lto7AUuNLVukE89eQJNGoBGns8","q":"ySjSLOWIDG8TAHeuJDVWU1YmweVz-SyXFr_ReFbxhSzTc_i-jiYaqGmnf89kT-qaR1d5ToQEEuZNNXnUo495IudTbQYxWzoorfLPPWXWEYvjDBnoTV36W92FEu1vzRak01NfbkcxwOm3rn27en9nx0TcroJ0BbID8dpCh39udXU","qi":"3-l5P0Q2mmj0VCDtuRx8TFpIC2W3zF-BT65-I4lbkI4V5VfiaFfv0JSQoH-CECeeS6p9wmwKJ2NLLzXpuVsaoWrO720aATjbS2gRKtr7P70uIyPZ6Ty0TDryqOpYejTQOg06uCNF2gerdF3vPD18J-OG5zfQoHRjc9BueSywIHg"}}`,
		},
		{
			"as jwk - bad private key",
			&mockDecryptionManager{
				result: `
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAvSEKpVFnAAV/Knr8g/AQYt46xEMVweKLH/ynEpoOAZVnS43Z
kq7pEoWydFAW3+iKALxEiCU6z4VTcOVG2hQCeJ3GisjZXJIffov9ND4rzido9Lja
mWXU53kjt5coAbcwmbDDQ/r/V5bs2NzeNq7VCx6V4VfyWK6ZA+XiTiEnph77lT0l
Xdt5UWhHPQpDbq7GT04vqdVBPJ+cg11Otondhr0hf4CtcSQ9sGg5yIx3FpTileBv
iBAJLFgkKcgtnTJjMZSHddH1m0fNHw5vvLUM9UnzV+eE0kawgr/fUS6UgEZ0iV+C
jFY9aOxHLep224UtIckh44xTcsCKxZ4G1M0vmwIDAQABAoIBAG+T9rvhcpXs0UE2
nZMZJhGuGe1/xm5EQN/2JnsK+AhnJDGm1h17o3WR+t40AcrHXeNhLu1DSZb0iW2p
VkuCUpLmQiPOqq26Z2o5HICdzSoqhfkatZyaPyjwhung+3FHqhyB9DE++zWpjMHE
TDTmoDmXKcVwJUG8f/mUvhZp6QJPcGBlWnOuboogPIsfNaeuxmpI0jmay8Cl0KVI
0I+jgbwRTdW7CbOwp2ntqwnXXMkWrQQ0aukSVGUW1+xt+xUzvm1khcTKujn/26NN
JJowoy0mf7B3/gYeXsuVU/YIVozitMyws4YdhUM1W2VA8Ew3LUriqgaMdX9oEA7O
tx4gwsECgYEA8LCarUzHhOAd05f+TvThR/SM/mjsBnbIeWbJnRxZrGqGZqj4eOzl
R1d1G0fn9qYn6FkJbq9rlo/pyx+SPPZfO4PrD3Z1BBMVjMxQhKhoqphtcH38XcN1
PkeNigzLWvM8qMoeYEnnICqzyN900Lto7AUuNLVukE89eQJNGoBGns8CgYEAySjS
LOWIDG8TAHeuJDVWU1YmweVz+SyXFr/ReFbxhSzTc/i+jiYaqGmnf89kT+qaR1d5
ToQEEuZNNXnUo495IudTbQYxWzoorfLPPWXWEYvjDBnoTV36W92FEu1vzRak01Nf
bkcxwOm3rn27en9nx0TcroJ0BbID8dpCh39udXUCgYAod9kZ6D3npnL9X6HfjqbO
HV0TbXq5v4EHgHPHmbuuFJ8SZbiZRGNsclT7SETFILy3ATlnxdDWGM5bW6yP2XC7
pfuAtw8Hp1nJOZUUKOioPkawUk57SWDOHuO6YVpTqW/6hTlEQUi+DM/7py6R5eDH
Rju1mwfC9b/FN9DU8tps2wKBgAmSzsXiOqJU2vOnvnrsquoWbIvHzsgqDhrAEEkI
4j+zTXD0gqUjPRuMw7L6fMys3qDMkfJhqAv6N+x2mt8Z4er+VWMX61trHiqBJsnG
QfTd0nVt+jdMZLDgjwfCkxKQpFGGY0FNVBnZRauhQj3nOFosddA8Vyc6PKPS/l2S
fABNAoGBAN/peT9ENppo9FQg7bkcfExaSAtlt8xfgU+ufiOJW5COFeVX4mhX79CU
kKB/ghAnnkuqfcJsCidjSy816blbGqFqzu9tGgE420toESra+z+9LiMj2ek8tEw6
8qjqWHo00DoNOrgjRdoHq3Rd7zw9fCfjhuc30KB0Y3PQbnkssCB4
-----END RSA PRIVATE KEY-----`,
			},
			`{"encrypted":"LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb3dJQkFBS0NBUUVBdlNFS3BWRm5TU1YvS25yOGcvQVFZdDQ2eEVNVndlS0xIL3luRXBvT0FaVm5TNDNaCmtxN3BFb1d5ZEZBVzMraUtBTHhFaUNVNno0VlRjT1ZHMmhRQ2VKM0dpc2paWEpJZmZvdjlORDRyemlkbzlMamEKbVdYVTUza2p0NWNvQWJjd21iRERRL3IvVjViczJOemVOcTdWQ3g2VjRWZnlXSzZaQStYaVRpRW5waDc3bFQwbApYZHQ1VVdoSFBRcERicTdHVDA0dnFkVkJQSitjZzExT3RvbmRocjBoZjRDdGNTUTlzR2c1eUl4M0ZwVGlsZUJ2CmlCQUpMRmdrS2NndG5USmpNWlNIZGRIMW0wZk5IdzV2dkxVTTlVbnpWK2VFMGthd2dyL2ZVUzZVZ0VaMGlWK0MKakZZOWFPeEhMZXAyMjRVdElja2g0NHhUY3NDWHhaNEcxTTB2bXdJREFRQUJBb0lCQUcrVDlydmhjcFhzMFVFMgpuWk1aSmhHdUdlMS94bTVFUU4vMkpuc0srQWhuSkRHbTFoMTdvM1dSK3Q0MEFjckhYZU5oTHUxRFNaYjBpVzJwClZrdUNVcExtUWlQT3FxMjZaMm81SElDZHpTb3FoZmthdFp5YVB5andodW5nKzNGSHFoeUI5REUrK3pXcGpNSEUKVERUbW9EbVhLY1Z3SlVHOGYvbVV2aFpwNlFKUGNHQmxXbk91Ym9vZ1BJc2ZOYWV1eG1wSTBqbWF5OENsMEtWSQowSStqZ2J3UlRkVzdDYk93cDJudHF3blhYTWtXclFRMGF1a1NWR1VXMSt4dCt4VXp2bTFraGNUS3Vqbi8yNk5OCkpKb3dveTBtZjdCMy9nWWVYc3VWVS9ZSVZveml0TXl3czRZZGhVTTFXMlZBOEV3M0xVcmlxZ2FNZFg5b0VBN08KdHg0Z3dzRUNnWUVBOExDYXJVekhoT0FkMDVmK1R2VGhSL1NNL21qc0JuYkllV2JKblJ4WnJHcUdacWo0ZU96bApSMWQxRzBmbjlxWW42RmtKYnE5cmxvL3B5eCtTUFBaZk80UHJEM1oxQkJNVmpNeFFoS2hvcXBodGNIMzhYY04xClBrZU5pZ3pMV3ZNOHFNb2VZRW5uSUNxenlOOTAwTHRvN0FVdU5MVnVrRTg5ZVFKTkdvQkduczhDZ1lFQXlTalMKTE9XSURHOFRBSGV1SkRWV1UxWW13ZVZ6K1N5WEZyL1JlRmJ4aFN6VGMvaStqaVlhcUdtbmY4OWtUK3FhUjFkNQpUb1FFRXVaTk5YblVvNDk1SXVkVGJRWXhXem9vcmZMUFBXWFdFWXZqREJub1RWMzZXOTJGRXUxdnpSYWswMU5mCmJrY3h3T20zcm4yN2VuOW54MFRjcm9KMEJiSUQ4ZHBDaDM5dWRYVUNnWUFvZDlrWjZEM25wbkw5WDZIZmpxYk8KSFYwVGJYcTV2NEVIZ0hQSG1idXVGSjhTWmJpWlJHTnNjbFQ3U0VURklMeTNBVGxueGREV0dNNWJXNnlQMlhDNwpwZnVBdHc4SHAxbkpPWlVVS09pb1BrYXdVazU3U1dET0h1TzZZVnBUcVcvNmhUbEVRVWkrRE0vN3B5NlI1ZURIClJqdTFtd2ZDOWIvRk45RFU4dHBzMndLQmdBbVN6c1hpT3FKVTJ2T252bnJzcXVvV2JJdkh6c2dxRGhyQUVFa0kKNGorelRYRDBncVVqUFJ1TXc3TDZmTXlzM3FETWtmSmhxQXY2Tit4Mm10OFo0ZXIrVldNWDYxdHJIaXFCSnNuRwpRZlRkMG5WdCtqZE1aTERnandmQ2t4S1FwRkdHWTBGTlZCblpSYXVoUWozbk9Gb3NkZEE4VnljNlBLUFMvbDJTCmZBQk5Bb0dCQU4vcGVUOUVOcHBvOUZRZzdia2NmRXhhU0F0bHQ4eGZnVSt1ZmlPSlc1Q09GZVZYNG1oWDc5Q1UKa0tCL2doQW5ua3VxZmNKc0NpZGpTeTgxNmJsYkdxRnF6dTl0R2dFNDIwdG9FU3JhK3orOUxpTWoyZWs4dEV3Ngo4cWpxV0hvMDBEb05PcmdqUmRvSHEzUmQ3enc5ZkNmamh1YzMwS0IwWTNQUWJua3NzQ0I0Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg=="}`, // base64 encoded string "somevalue"
			"?jwk=1",
			http.StatusInternalServerError,
			`{"error":"crypto/rsa: invalid modulus","status":500}`,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			rt := router{manager: test.manager}

			w := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodPost, fmt.Sprintf("/%s", test.query), strings.NewReader(test.body))

			rt.handleDecrypt(w, r)

			if w.Code != test.expectedStatusCode {
				t.Errorf("Expected status code %v, got %v", test.expectedStatusCode, w.Code)
			}

			if w.Body.String() != test.expectedBody {
				t.Errorf("Expected body %s, got %s", test.expectedBody, w.Body.String())
			}
		})
	}
}
