package main

import (
	"encoding/xml"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/text/language"
	"golang.org/x/text/search"
)

// Totozes list
type Totozes struct {
	XMLName xml.Name `xml:"totozes" json:"-"`
	Totozes []Totoz  `xml:"totoz" json:"totozes"`
}

// Totoz description
type Totoz struct {
	XMLName xml.Name `xml:"totoz" json:"-"`
	Name    string   `xml:"name" json:"name"`
	Image   string   `json:"image"`
}

func searchTotozesInCache(terms string) (totozes Totozes, err error) {
	totozes = Totozes{}

	files, err := filepath.Glob(totozCacheDir + "/*.tags")
	if nil != err {
		return totozes, err
	}

	matcher := search.New(language.French, search.Loose)
	pattern := matcher.CompileString(terms)

	for _, file := range files {
		if start, _ := pattern.IndexString(file); start >= 0 {
			totozes.Totozes = append(totozes.Totozes, Totoz{Name: strings.TrimSuffix(filepath.Base(file), ".tags")})
			continue
		}

		fileContent, err := os.ReadFile(file)
		if nil != err {
			log.Printf("Cannot read totoz tags from %s", file)
			continue
		}
		if start, _ := pattern.Index(fileContent, 0); start >= 0 {
			totozes.Totozes = append(totozes.Totozes, Totoz{Name: strings.TrimSuffix(filepath.Base(file), ".tags")})
			continue
		}

	}
	return totozes, err
}

// TotozSearch handler
func totozCacheSearch(w http.ResponseWriter, r *http.Request) {
	terms := url.QueryEscape(r.FormValue("terms"))
	totozes, err := searchTotozesInCache(terms)
	if nil != err {
		log.Println("Cannot find totoz tags in directory ", totozCacheDir, " : ", err)
		return
	}

	remoteHost := r.Header.Get("X-Forwarded-Host")
	if len(remoteHost) == 0 {
		remoteHost = r.Host
	}

	remoteProtocol := r.Header.Get("X-Forwarded-Proto")
	if len(remoteProtocol) == 0 {
		remoteProtocol = "http"
	}

	for t := range totozes.Totozes {
		u := url.URL{
			Scheme: remoteProtocol,
			Host:   remoteHost,
			Path:   fmt.Sprintf("/img/%s", totozes.Totozes[t].Name),
		}
		totozes.Totozes[t].Image = u.String()
	}
	w.Header().Set("Content-Type", "application/xml")
	e := xml.NewEncoder(w)
	err = e.Encode(&totozes)
	if nil != err {
		http.Error(w, fmt.Sprintf("Cannot encode totoz search results: %s. Blame dave.", err), 500)
		return
	}
}

func ServeTotozCacheApi() {
	http.HandleFunc("/search.xml", totozCacheSearch)

	listenAddress := os.Getenv("CACHETOTOZ_LISTEN")
	if len(listenAddress) == 0 {
		listenAddress = ":16668"
	}
	log.Printf("Listen to %s\n", listenAddress)
	err := http.ListenAndServe(listenAddress, nil)
	if nil != err {
		log.Fatal(err)
	}
}
