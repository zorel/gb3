//go:build sqlite

package main

import (
	"log"

	_ "modernc.org/sqlite"
)

func init() {
	log.Println("Mmh you touch my sqlite")
}
