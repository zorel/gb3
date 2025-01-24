//go:build !cgo

package main

import (
	"database/sql"

	_ "modernc.org/sqlite" // SQLite no-CGO database driver
)

func sqliteOpen(dbPath string) (*sql.DB, error) {
	return sql.Open("sqlite", dbPath)
}
