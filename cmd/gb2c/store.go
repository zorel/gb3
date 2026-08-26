package main

import (
	"fmt"
	"log"
	"os"
	"path"
	"strconv"
	"strings"
)

// Store tribune's posts
type Store interface {
	Save(tribune string, posts Posts) error
	RetrieveLatests(tribune string) (Posts, error)
}

func getIntFromEnv(envVar string, defaultValue int) int {
	value, isPresent := os.LookupEnv(envVar)
	if isPresent {
		intValue, err := strconv.Atoi(value)
		if nil != err {
			log.Printf("Invalid value for %s: %v\n", envVar, err)
		} else {
			return intValue
		}
	}
	return defaultValue
}

func newStore() (Store, error) {
	maxPostsInHistory := getIntFromEnv("GB2C_MAX_POSTS_IN_HISTORY", 200)

	storeType := strings.ToLower(os.Getenv("GB2C_STORE"))
	switch storeType {
	case "", "memory":
		log.Println("Using in-memory store")
		return NewMemStore(maxPostsInHistory), nil
	case "sqlite":
		var err error
		dbPath := os.Getenv("GB2C_SQLITE_PATH")
		if dbPath == "" {
			dbPath, err = os.MkdirTemp("", "gb2c")
			if err != nil {
				return nil, fmt.Errorf("could not create temporary store directory: %v", err)
			}
			dbPath = path.Join(dbPath, "posts.sqlite")
		}

		maxStoredPosts := getIntFromEnv("GB2C_SQLITE_MAX_POSTS_IN_STORAGE", maxPostsInHistory)

		store, err := NewSqliteStore(dbPath, maxPostsInHistory, maxStoredPosts)
		if err != nil {
			return nil, fmt.Errorf("could not create SQLite store: %v", err)
		} else {
			log.Printf("Using SQLite store in %s\n", dbPath)
			return store, nil
		}
	default:
		log.Println("Unknown store type: ", storeType)
		return nil, fmt.Errorf("unknown store type: %s", storeType)
	}
}
