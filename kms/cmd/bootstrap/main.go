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
		out        = flag.String("out", "", "where to write the key file")
	)
	flag.Parse()
	kc, err := keyloader.GenerateKey(*cipher, *identifier, false, time.Now())
	if err != nil {
		log.Fatal(err)
	}
	b, bErr := json.Marshal(kc)
	if bErr != nil {
		panic(bErr)
	}

	if err := ioutil.WriteFile(*out, b, 0644); err != nil {
		panic(err)
	}
	fmt.Printf(`Successfully created keyfile "%s".
If in development, you will now need to recreate your database.
`, *out)
}
