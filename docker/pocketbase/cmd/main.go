package main

import (
	"log"

	"github.com/pocketbase/pocketbase"
	pbaudit "github.com/skeeeon/pb-audit"
)

func main() {
	app := pocketbase.New()

	// Setup audit logging with default options
	if err := pbaudit.Setup(app, pbaudit.DefaultOptions()); err != nil {
		log.Fatalf("Failed to setup audit logging: %v", err)
	}

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
