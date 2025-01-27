//go:build cgo

package main

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3" // SQLite CGO database driver
)

func sqliteOpen(dbPath string) (*sql.DB, error) {
	return sql.Open("sqlite3", dbPath)
}
