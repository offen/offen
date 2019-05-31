package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"time"

	"github.com/ovh/symmecrypt/keyloader"
)

func main() {
	var (
		cipher     = flag.String("cipher", "aes-gcm", "the cipher used for generating the key")
		identifier = flag.String("identifier", "offen", "the identifier of the key")
	)
	kc, err := keyloader.GenerateKey(*cipher, *identifier, false, time.Now())
	if err != nil {
		log.Fatal(err)
	}
	b, bErr := json.Marshal(kc)
	if bErr != nil {
		panic(bErr)
	}
	formatted := fmt.Sprintf("- key: encryption-key\n  value: '%s'", string(b))
	if err := ioutil.WriteFile("key.txt", []byte(formatted), 0644); err != nil {
		panic(err)
	}

}
