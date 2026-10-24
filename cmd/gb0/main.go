package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode/utf8"
)

//go:embed static
var staticContent embed.FS

var postStore Store

func stripControlsCharsFromString(str string) string {
	return strings.Map(func(r rune) rune {
		if r >= 32 && r != 127 {
			return r
		}
		return -1
	}, str)
}

func handlePost(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if nil != err {
		http.Error(w, fmt.Sprintf("Invalid request : %s", err), http.StatusBadRequest)
		return
	}
	message := r.FormValue("message")
	if !utf8.ValidString(message) {
		http.Error(w, "Invalid utf8 in message", http.StatusBadRequest)
		return
	}
	message = strings.TrimSpace(message)
	if len(message) == 0 {
		http.Error(w, "Empty message forbidden : say something please !", http.StatusBadRequest)
		return
	}
	info := r.FormValue("info")
	if len(info) == 0 {
		info = r.UserAgent()
	}
	if !utf8.ValidString(info) {
		http.Error(w, "Invalid utf8 in user agent", http.StatusBadRequest)
		return
	}
	ip := r.Header.Get("X-Forwarded-For")
	if len(ip) == 0 {
		ip = r.RemoteAddr
	}
	postStore.WritePost(&Post{
		Message: stripControlsCharsFromString(fmt.Sprintf("%.65536s", message)),
		Info:    stripControlsCharsFromString(fmt.Sprintf("%.32s", info)),
		ip:      ip,
	})
}

func handleGetTSV(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/tab-separated-values")
	posts := postStore.ReadPosts()
	for _, p := range posts {
		p.PrintTSV(w) //nolint:errcheck
	}
}

func main() {
	var err error

	postStore, err = NewStore()
	if err != nil {
		log.Fatalf("Could not initialize store: %v", err)
	}
	defer postStore.Close()

	http.HandleFunc("/gb0/tsv", handleGetTSV)
	http.HandleFunc("/gb0/post", handlePost)

	staticfs, err := fs.Sub(staticContent, "static")
	if nil != err {
		log.Fatal(err)
	}
	http.Handle("/", http.FileServer(http.FS(staticfs)))

	listenAddress := os.Getenv("GB0_LISTEN")
	if len(listenAddress) == 0 {
		listenAddress = ":16667"
	}
	log.Printf("Listen to %s\n", listenAddress)

	server := http.Server{
		Addr:         listenAddress,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	if err := server.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
