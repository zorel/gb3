package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
)

var storeMap = make(map[string]func() (Store, error))

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
	storeType := strings.ToLower(os.Getenv("GB2C_STORE"))
	storeCtor, found := storeMap[storeType]
	if !found {
		log.Println("Unknown store type: ", storeType)
		return nil, fmt.Errorf("unknown store type: %s", storeType)
	}

	return storeCtor()
}
