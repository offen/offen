package main

import (
	"encoding/base64"
	"flag"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	var (
		pass = flag.String("pass", "", "the password to hash")
	)
	flag.Parse()
	b, err := bcrypt.GenerateFromPassword([]byte(*pass), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}
	fmt.Println("==================================")
	fmt.Println(base64.StdEncoding.EncodeToString(b))
	fmt.Println("==================================")

	if err := bcrypt.CompareHashAndPassword(b, []byte(*pass)); err == nil {
		fmt.Println("Compare returned no error")
		fmt.Println("==================================")
	}
}
