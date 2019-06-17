//+build integration

package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	os.Setenv("KEY_FILE", "./../../key.txt")
	go main()
	time.Sleep(time.Millisecond * 50)
	os.Exit(m.Run())
}

func TestKMS_Encrypt_Decrypt(t *testing.T) {
	t.Run("ok", func(t *testing.T) {
		var result string
		{
			body := strings.NewReader(`{"decrypted":"expected-value"}`)
			req, err := http.NewRequest(http.MethodPost, "http://localhost:8080/encrypt", body)
			if err != nil {
				t.Fatalf("Unexpected error %v", err)
			}
			res, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("Unexpected error %v", err)
			}
			if res.StatusCode != http.StatusOK {
				bd, _ := ioutil.ReadAll(res.Body)
				t.Errorf("Unexpected status code %d with body %s", res.StatusCode, string(bd))
			}
			defer req.Body.Close()

			r := struct {
				Encrypted string `json:"encrypted"`
			}{}
			json.NewDecoder(res.Body).Decode(&r)
			result = r.Encrypted
		}
		fmt.Println(result)
		var result2 string
		{
			body := strings.NewReader(fmt.Sprintf(`{"encrypted":"%s"}`, result))
			req, err := http.NewRequest(http.MethodPost, "http://localhost:8080/decrypt", body)
			if err != nil {
				t.Fatalf("Unexpected error %v", err)
			}
			res, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatalf("Unexpected error %v", err)
			}
			if res.StatusCode != http.StatusOK {
				bd, _ := ioutil.ReadAll(res.Body)
				t.Errorf("Unexpected status code %d with body %s", res.StatusCode, string(bd))
			}
			defer req.Body.Close()

			r := struct {
				Decrypted string `json:"decrypted"`
			}{}
			json.NewDecoder(res.Body).Decode(&r)
			result2 = r.Decrypted
		}
		if result2 != "expected-value" {
			t.Errorf("Unexpected result %s", result2)
		}
	})
}

func TestKMS_Encrypt(t *testing.T) {
	t.Run("malformed body", func(t *testing.T) {
		body := strings.NewReader(`plain text payload`)
		req, err := http.NewRequest(http.MethodPost, "http://localhost:8080/encrypt", body)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatalf("Unexpected error %v", err)
		}
		if res.StatusCode != http.StatusBadRequest {
			t.Errorf("Unexpected status code %d", res.StatusCode)
		}
	})
}
