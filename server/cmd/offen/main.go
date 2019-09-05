package main

import (
	"crypto/rand"
	"encoding/base64"
	"flag"
	"fmt"
	"io"
	"os"
)

func main() {
	secretCmd := flag.NewFlagSet("secret", flag.ExitOnError)
	length := secretCmd.Int("length", 16, "the number of bytes")

	if len(os.Args) < 2 {
		fmt.Println("expected subcommand to be given")
		os.Exit(1)
	}

	switch os.Args[1] {
	case "secret":
		secretCmd.Parse(os.Args[2:])
		value, err := getSecretValue(*length)
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
		fmt.Println(value)
	}
}

func getSecretValue(length int) (string, error) {
	b := make([]byte, length)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(b), nil
}
