//go:build cgo && sqlite

package main

import (
	"log"

	_ "github.com/mattn/go-sqlite3"
)

func init() {
	log.Println("Mmh you touch my sqlite")
}
