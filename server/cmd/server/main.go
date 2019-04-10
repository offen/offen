package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/offen/offen/server/persistence/memory"
	"github.com/offen/offen/server/router"
)

func main() {
	var (
		port = flag.Int("port", 8080, "the port the server binds to")
	)
	flag.Parse()

	db := memory.New()
	rt := router.New(db)

	err := http.ListenAndServe(fmt.Sprintf(":%d", *port), rt)
	log.Fatal(err)
}
