package local

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func (l *localKeyOps) RemoteEncrypt(value []byte) ([]byte, error) {
	p := struct {
		Decrypted string `json:"decrypted"`
	}{
		Decrypted: string(value),
	}
	payload, _ := json.Marshal(&p)
	res, err := http.Post(
		l.encryptionEndpoint,
		"application/json",
		bytes.NewReader(payload),
	)
	if err != nil {
		return nil, fmt.Errorf("local: error calling remote encryption endpoint: %v", err)
	}

	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		response := struct {
			Error  string `json:"error"`
			Status int    `json:"status"`
		}{}
		if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
			return nil, fmt.Errorf("local: error decoding error response from server: %v", err)
		}
		return nil, fmt.Errorf("local: remote returned error with status %v when encrypting: %v", response.Error, response.Status)
	}

	r := struct {
		Encrypted string `json:"encrypted"`
	}{}
	if err := json.NewDecoder(res.Body).Decode(&r); err != nil {
		return nil, fmt.Errorf("local: error decoding response body from remote: %v", err)
	}
	return []byte(r.Encrypted), nil
}
