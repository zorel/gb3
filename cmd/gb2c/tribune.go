package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
)

const (
	// NoAuthentification Anonymous post
	NoAuthentification = 0
	// OAuth2Authentification annoying dlfp authentification
	OAuth2Authentification = 1
)

// Tribune parameters
type Tribune struct {
	Name                 string
	BackendURL           string
	PostURL              string
	PostField            string
	InfoField            string
	AuthentificationType int
}

type TribuneClient struct {
	httpClient *http.Client
}

func NewTribuneClient(httpClient *http.Client) *TribuneClient {
	return &TribuneClient{httpClient: httpClient}
}

// Post message to tribune
func (tc *TribuneClient) Post(tribune *Tribune, message, info, authorization string) {
	data := url.Values{
		tribune.PostField: []string{message},
	}
	if len(tribune.InfoField) > 0 {
		data[tribune.InfoField] = []string{info}
	}
	outRequest, err := http.NewRequest("POST", tribune.PostURL, strings.NewReader(data.Encode()))
	if nil != err {
		log.Println(err)
		return
	}
	outRequest.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	if len(tribune.InfoField) == 0 {
		outRequest.Header.Set("User-Agent", info)
	}
	if tribune.AuthentificationType == OAuth2Authentification {
		outRequest.Header.Set("Authorization", authorization)
	}
	response, err := tc.httpClient.Do(outRequest)
	if nil != err {
		log.Println(err)
		return
	}
	response.Body.Close()
}

// Poll Retrieve backend
func (tc *TribuneClient) Poll(tribune *Tribune) (Posts, error) {
	resp, err := tc.httpClient.Get(tribune.BackendURL)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("erreur de %s : %d %s", tribune.BackendURL, resp.StatusCode, resp.Status)
	}

	posts, err := tc.parseTSVBackend(tribune, resp.Body)
	if err != nil {
		return nil, err
	}

	sort.Sort(posts)
	return posts, nil
}

func (tc *TribuneClient) parseTSVBackend(tribune *Tribune, body io.Reader) (Posts, error) {
	posts := make(Posts, 0, 100) // 100 seems to be a good starting point depending on the tribune
	data, err := io.ReadAll(body)
	if nil != err {
		return nil, err
	}
	// Work on one string so every field is a free substring of it instead of a
	// separate allocation per line and per field.
	rest := string(data)
	for len(rest) > 0 {
		line := rest
		if newline := strings.IndexByte(rest, '\n'); newline >= 0 {
			line = rest[:newline]
			rest = rest[newline+1:]
		} else {
			rest = ""
		}

		record, ok := splitTSVLine(line)
		if !ok {
			continue
		}
		id, err := strconv.ParseInt(record[0], 10, 64)
		if nil != err {
			log.Println(err)
			continue
		}
		post := Post{ID: id, Time: record[1], Info: record[2], Login: record[3], Message: record[4], Tribune: tribune.Name}
		posts = append(posts, post)
	}
	return posts, nil
}

// splitTSVLine splits a backend line into the five leading fields without
// allocating: the returned strings share the caller's backing string. Anything
// after the fifth field is dropped.
func splitTSVLine(line string) ([5]string, bool) {
	var record [5]string
	rest := line
	for i := 0; i < 4; i++ {
		tab := strings.IndexByte(rest, '\t')
		if tab < 0 {
			return record, false
		}
		record[i] = rest[:tab]
		rest = rest[tab+1:]
	}
	if tab := strings.IndexByte(rest, '\t'); tab >= 0 {
		rest = rest[:tab]
	}
	record[4] = rest
	return record, true
}
