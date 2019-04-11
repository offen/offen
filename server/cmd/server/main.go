package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/offen/offen/server/persistence/memory"
	"github.com/offen/offen/server/router"
)

func main() {
	var (
		port = flag.Int("port", 8080, "the port the server binds to")
	)
	flag.Parse()

	db := memory.New()

	srv := &http.Server{
		Addr:    fmt.Sprintf("0.0.0.0:%v", *port),
		Handler: router.New(db),
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil {
			log.Fatal(err)
		}
	}()

	quit := make(chan os.Signal)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM, syscall.SIGKILL, syscall.SIGHUP)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal(err.Error())
	}
}
