package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/offen/offen/server/persistence/relational"
	gormigrate "gopkg.in/gormigrate.v1"
)

func main() {
	var (
		connection = flag.String("conn", os.Getenv("POSTGRES_CONNECTION_STRING"), "a postgres connection string")
	)
	flag.Parse()

	db, err := gorm.Open("postgres", *connection)
	if err != nil {
		log.Fatal(err)
	}

	db.LogMode(true)
	m := gormigrate.New(db, gormigrate.DefaultOptions, []*gormigrate.Migration{})

	m.InitSchema(func(tx *gorm.DB) error {
		return tx.AutoMigrate(
			&relational.Event{},
			&relational.Account{},
			&relational.User{},
			&relational.AccountUser{},
			&relational.AccountUserRelationship{},
		).Error
	})

	if err := m.Migrate(); err != nil {
		log.Fatal(err)
	}
	fmt.Println("Successfully ran database migrations.")
}
