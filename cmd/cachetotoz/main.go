package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

var totozRegex = regexp.MustCompile("^[A-Za-z0-9-_ !$'*+-.:²µ¸¹ÃÇßæèøûвмотԝ①③⑦愛]+$")
var totozCacheDir string
var durationBetweenRequests time.Duration

func initCacheDir() {
	totozCacheDir = os.Getenv("CACHETOTOZ_CACHE_DIRECTORY")
	if len(totozCacheDir) == 0 {
		log.Println("CACHETOTOZ_CACHE_DIRECTORY is empty or not defined, totoz will be cached in a temporary directory")
		totozCacheDir, _ = os.MkdirTemp("", "cachetotoz")
	}
	info, err := os.Stat(totozCacheDir)
	if nil != err {
		log.Fatalln("Cannot stat", info, err)
	}
	if !info.IsDir() {
		log.Fatalln(info, "is not a directory")
	}
	fmt.Println("Totozes will be cached in", totozCacheDir)
}

func initDurationBetweenRequests() {
	value := os.Getenv("CACHETOTOZ_DURATION_BETWEEN_REQUESTS")
	if len(value) == 0 {
		value = "1h"
		log.Println("CACHETOTOZ_DURATION_BETWEEN_REQUESTS is empty or not defined. Default value will be used.")
	}
	durationValue, err := time.ParseDuration(value)
	if nil != err {
		log.Fatalln("Invalid value for CACHETOTOZ_DURATION_BETWEEN_REQUESTS", err)
	}
	durationBetweenRequests = durationValue
	fmt.Println("Will wait", durationBetweenRequests, "between requests to totoz server")
}

func cacheTotozTags(totozName string) (cached bool, err error) {
	totozTagsFilename := path.Join(totozCacheDir, totozName+".tags")
	_, err = os.Stat(totozTagsFilename)
	if nil == err {
		return false, nil
	}

	totozUrl, err := url.JoinPath("https://nsfw.totoz.eu/totoz", totozName)
	if nil != err {
		return false, err
	}

	res, err := http.Get(totozUrl)
	if nil != err {
		return false, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return false, fmt.Errorf("erreur de nsfw.totoz.eu : %d %s", res.StatusCode, res.Status)
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if nil != err {
		return false, err
	}

	totozTags := doc.Find(".totoz .tags").Text()

	totozTagsFile, err := os.Create(totozTagsFilename)
	if nil != err {
		return false, err
	}
	defer totozTagsFile.Close()

	_, err = io.WriteString(totozTagsFile, totozTags)
	return true, err
}

func cacheTotozImage(totozName string) (cached bool, err error) {
	totozImageFilename := path.Join(totozCacheDir, totozName)

	_, err = os.Stat(totozImageFilename)
	if nil == err {
		return false, nil
	}

	totozImageUrl, err := url.JoinPath("https://nsfw.totoz.eu/img", totozName)
	if nil != err {
		return false, err
	}

	res, err := http.Get(totozImageUrl)
	if nil != err {
		return false, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return false, fmt.Errorf("erreur de nsfw.totoz.eu : %d %s", res.StatusCode, res.Status)
	}

	totozImageFile, err := os.Create(totozImageFilename)
	if nil != err {
		return false, err
	}
	defer totozImageFile.Close()

	_, err = io.Copy(totozImageFile, res.Body)
	return true, err
}

func cacheLastestTotozes() {
	res, err := http.Get("https://nsfw.totoz.eu/")
	if nil != err {
		log.Println(err)
		return
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		log.Printf("erreur de nsfw.totoz.eu : %d %s\n", res.StatusCode, res.Status)
		return
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		log.Println(err)
		return
	}

	nbTotozFound := 0
	nbImagesCached := 0
	nbTagsCached := 0
	doc.Find(".totoz").Each(func(i int, s *goquery.Selection) {

		//totoz regex /^[A-Za-z0-9-_ ]+$/ ?
		totozNameWithMarkup := s.Find(".name").Text()
		totozName, prefixFound := strings.CutPrefix(totozNameWithMarkup, "[:")
		if !prefixFound {
			log.Printf("Totoz %s is not prefixed with [:\n", totozNameWithMarkup)
			return
		}
		totozName, suffixFound := strings.CutSuffix(totozName, "]")
		if !suffixFound {
			log.Printf("Totoz %s is not prefixed with [:\n", totozNameWithMarkup)
			return
		}
		if !totozRegex.MatchString(totozName) {
			log.Printf("Totoz %s contains invalid characters\n", totozNameWithMarkup)
			return
		}

		nbTotozFound++

		imageCached, err := cacheTotozImage(totozName)
		if nil != err {
			log.Printf("Cannot cache totoz %s image\n", totozNameWithMarkup)
			return
		}
		if imageCached {
			nbImagesCached++
		}
		tagsCached, err := cacheTotozTags(totozName)
		if nil != err {
			log.Printf("Cannot cache totoz %s tags\n", totozNameWithMarkup)
			return
		}
		if tagsCached {
			nbTagsCached++
		}
	})

	fmt.Printf("Found %d totozes, cached %d images and %d tags\n", nbTotozFound, nbImagesCached, nbTagsCached)
}

func main() {

	initCacheDir()
	initDurationBetweenRequests()

	for {
		cacheLastestTotozes()
		time.Sleep(durationBetweenRequests)
	}
}
