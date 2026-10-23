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
	"sync"
	"sync/atomic"
	"time"

	"github.com/PuerkitoBio/goquery"
)

var totozCacheDir string

// totozHttpClient is shared so connections can be reused between downloads.
var totozHttpClient = &http.Client{Timeout: 30 * time.Second}

const maxTagsToRetrieve = 100
const durationBetweenRetrieve = time.Hour

// totozFetchConcurrency limits parallel downloads from nsfw.totoz.eu.
const totozFetchConcurrency = 8

func forEachConcurrently(count int, fn func(int)) {
	semaphore := make(chan struct{}, totozFetchConcurrency)
	var waitGroup sync.WaitGroup
	for i := 0; i < count; i++ {
		waitGroup.Add(1)
		semaphore <- struct{}{}
		go func(i int) {
			defer waitGroup.Done()
			defer func() { <-semaphore }()
			fn(i)
		}(i)
	}
	waitGroup.Wait()
}

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

var totozRegex = regexp.MustCompile("^[A-Za-z0-9-_ !$'*+-.:²µ¸¹ÃÇßæèøûвмотԝ①③⑦愛]+$")

func isValidTotozName(totozName string) bool {
	return totozRegex.MatchString(totozName) && !strings.HasSuffix(totozName, ".tags")
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

	res, err := totozHttpClient.Get(totozUrl)
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

	res, err := totozHttpClient.Get(totozImageUrl)
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

func retrieveLastestTotozes() {
	res, err := totozHttpClient.Get("https://nsfw.totoz.eu/")
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

	var totozNames []string
	doc.Find(".totoz").Each(func(i int, s *goquery.Selection) {

		//totoz regex /^[A-Za-z0-9-_ ]+$/ ?
		totozNameWithMarkup := s.Find(".name").Text()
		totozName := strings.TrimPrefix(totozNameWithMarkup, "[:")
		totozName = strings.TrimSuffix(totozName, "]")
		if !isValidTotozName(totozName) {
			log.Printf("Totoz %s contains invalid characters\n", totozNameWithMarkup)
			return
		}
		totozNames = append(totozNames, totozName)
	})

	var nbImagesCached atomic.Int64
	var nbTagsCached atomic.Int64
	forEachConcurrently(len(totozNames), func(i int) {
		totozName := totozNames[i]
		imageCached, err := cacheTotozImage(totozName)
		if nil != err {
			log.Printf("Cannot cache totoz %s image : %v\n", totozName, err)
			return
		}
		if imageCached {
			nbImagesCached.Add(1)
		}
		tagsCached, err := cacheTotozTags(totozName)
		if nil != err {
			log.Printf("Cannot cache totoz %s tags : %v\n", totozName, err)
			return
		}
		if tagsCached {
			nbTagsCached.Add(1)
		}
	})

	fmt.Printf("Found %d totozes, cached %d images and %d tags\n", len(totozNames), nbImagesCached.Load(), nbTagsCached.Load())
}

func retrieveMissingTags() {
	files, err := os.ReadDir(totozCacheDir)
	if nil != err {
		log.Fatal(err)
	}

	missingTags := make([]string, 0, maxTagsToRetrieve)
	for _, file := range files {
		if !file.Type().IsRegular() {
			continue
		}
		totozName := file.Name()
		if !isValidTotozName(totozName) {
			continue
		}
		if _, err := os.Stat(path.Join(totozCacheDir, totozName+".tags")); err == nil {
			continue
		}
		missingTags = append(missingTags, totozName)
		if len(missingTags) >= maxTagsToRetrieve {
			break
		}
	}

	var nbTagsCached atomic.Int64
	forEachConcurrently(len(missingTags), func(i int) {
		totozName := missingTags[i]
		tagsCached, err := cacheTotozTags(totozName)
		if nil != err {
			log.Printf("Cannot cache totoz %s tags : %v\n", totozName, err)
			return
		}
		if tagsCached {
			nbTagsCached.Add(1)
		}
	})
	fmt.Printf("Found %d totozes without tags, cached %d tags\n", len(missingTags), nbTagsCached.Load())
}
func main() {

	initCacheDir()

	go ServeTotozCacheApi()

	for {
		retrieveLastestTotozes()
		retrieveMissingTags()
		time.Sleep(durationBetweenRetrieve)
	}
}
