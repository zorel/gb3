package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

var totozCacheDir string

const (
	maxTagsToRetrieve       = 100
	durationBetweenRetrieve = time.Hour
)

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
	root, err := os.OpenRoot(totozCacheDir)
	if err != nil {
		return
	}
	defer root.Close()

	totozTagsFilename := totozName + ".tags"
	_, err = root.Stat(totozTagsFilename)
	if nil == err {
		return false, nil
	}

	totozURL, err := url.JoinPath("https://nsfw.totoz.eu/totoz", totozName)
	if nil != err {
		return false, err
	}

	res, err := http.Get(totozURL)
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

	totozTagsFile, err := root.Create(totozTagsFilename)
	if nil != err {
		return false, err
	}
	if _, err := io.WriteString(totozTagsFile, totozTags); err != nil {
		return false, err
	}
	if err := totozTagsFile.Close(); err != nil {
		return false, err
	}

	return true, nil
}

func cacheTotozImage(totozName string) (cached bool, err error) {
	root, err := os.OpenRoot(totozCacheDir)
	if err != nil {
		return
	}
	defer root.Close()

	totozImageFilename := totozName

	_, err = root.Stat(totozImageFilename)
	if nil == err {
		return false, nil
	}

	totozImageURL, err := url.JoinPath("https://nsfw.totoz.eu/img", totozName)
	if nil != err {
		return false, err
	}

	res, err := http.Get(totozImageURL)
	if nil != err {
		return false, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return false, fmt.Errorf("erreur de nsfw.totoz.eu : %d %s", res.StatusCode, res.Status)
	}

	totozImageFile, err := root.Create(totozImageFilename)
	if nil != err {
		return false, err
	}
	if _, err = io.Copy(totozImageFile, res.Body); err != nil {
		return false, err
	}
	if err := totozImageFile.Close(); err != nil {
		return false, err
	}

	return true, nil
}

func retrieveLastestTotozes() {
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
	doc.Find(".totoz").Each(func(_ int, s *goquery.Selection) {
		// totoz regex /^[A-Za-z0-9-_ ]+$/ ?
		totozNameWithMarkup := s.Find(".name").Text()
		totozName := strings.TrimPrefix(totozNameWithMarkup, "[:")
		totozName = strings.TrimSuffix(totozName, "]")
		if !isValidTotozName(totozName) {
			log.Printf("Totoz %s contains invalid characters\n", totozNameWithMarkup)
			return
		}

		nbTotozFound++

		imageCached, err := cacheTotozImage(totozName)
		if nil != err {
			log.Printf("Cannot cache totoz %s image : %v\n", totozNameWithMarkup, err)
			return
		}
		if imageCached {
			nbImagesCached++
		}
		tagsCached, err := cacheTotozTags(totozName)
		if nil != err {
			log.Printf("Cannot cache totoz %s tags : %v\n", totozNameWithMarkup, err)
			return
		}
		if tagsCached {
			nbTagsCached++
		}
	})

	fmt.Printf("Found %d totozes, cached %d images and %d tags\n", nbTotozFound, nbImagesCached, nbTagsCached)
}

func retrieveMissingTags() {
	nbTotozFoundWithMissingTags := 0
	nbTagsCached := 0

	files, err := os.ReadDir(totozCacheDir)
	if nil != err {
		log.Fatal(err)
	}

	for _, file := range files {
		if !file.Type().IsRegular() {
			continue
		}
		totozName := file.Name()
		if !isValidTotozName(totozName) {
			continue
		}
		tagsCached, err := cacheTotozTags(totozName)
		if nil != err {
			nbTotozFoundWithMissingTags++
			log.Printf("Cannot cache totoz %s tags : %v\n", totozName, err)
			continue
		}
		if tagsCached {
			nbTotozFoundWithMissingTags++
			nbTagsCached++
			if nbTagsCached >= maxTagsToRetrieve {
				break
			}
		}
	}
	fmt.Printf("Found %d totozes without tags, cached %d tags\n", nbTotozFoundWithMissingTags, nbTagsCached)
}

func main() {
	initCacheDir()

	go ServeTotozCacheAPI()

	for {
		retrieveLastestTotozes()
		retrieveMissingTags()
		time.Sleep(durationBetweenRetrieve)
	}
}
