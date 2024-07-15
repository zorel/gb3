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

	"github.com/PuerkitoBio/goquery"
)

var totozRegex = regexp.MustCompile("^[A-Za-z0-9-_ !$'*+-.:²µ¸¹ÃÇßæèøûвмотԝ①③⑦愛]+$")
var totozCacheDir string

func cacheTotoz(totozUrl string) {
	fmt.Printf("Totoz %s\n", totozUrl)
	res, err := http.Get(totozUrl)
	if nil != err {
		log.Println(err)
		return
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		log.Printf("Erreur de nsfw.totoz.eu : %d %s\n", res.StatusCode, res.Status)
		return
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if nil != err {
		log.Println(err)
		return
	}

	//totoz regex /^[A-Za-z0-9-_ ]+$/ ?
	totozNameWithMarkup := doc.Find(".totoz .name").Text()
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
	totozTags := doc.Find(".totoz .tags").Text()
	fmt.Printf("Caching totoz %s with tags : %s\n", totozNameWithMarkup, totozTags)
	err = cacheTotozImage(totozName)
	if nil != err {
		log.Printf("Cannot cache totoz %s image\n", totozNameWithMarkup)
		return
	}
	err = cacheTotozTags(totozName, totozTags)
	if nil != err {
		log.Printf("Cannot cache totoz %s tags\n", totozNameWithMarkup)
		return
	}

}

func cacheTotozTags(totozName, totozTags string) error {
	totozImageFilename := path.Join(totozCacheDir, totozName+".tags")
	totozTagsFile, err := os.Create(totozImageFilename)
	if nil != err {
		return err
	}
	defer totozTagsFile.Close()

	_, err = io.WriteString(totozTagsFile, totozTags)
	return err
}

func cacheTotozImage(totozName string) error {
	totozImageUrl, err := url.JoinPath("https://nsfw.totoz.eu/img", totozName)
	if nil != err {
		return err
	}

	res, err := http.Get(totozImageUrl)
	if nil != err {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return fmt.Errorf("erreur de nsfw.totoz.eu : %d %s", res.StatusCode, res.Status)
	}

	totozImageFilename := path.Join(totozCacheDir, totozName)
	totozImageFile, err := os.Create(totozImageFilename)
	if nil != err {
		return err
	}
	defer totozImageFile.Close()

	_, err = io.Copy(totozImageFile, res.Body)
	return err
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

	doc.Find(".totoz .img").Each(func(i int, s *goquery.Selection) {
		totozHref, totozHrefExist := s.Attr("href")
		if !totozHrefExist {
			log.Println("cannot find totoz page url : href attribute is missing")
			return
		}
		totozUrl, err := url.JoinPath("https://nsfw.totoz.eu", totozHref)
		if nil != err {
			log.Println(err)
			return
		}
		cacheTotoz(totozUrl)
	})
}

func main() {
	totozCacheDir = os.Getenv("CACHETOTOZ_CACHE_DIRECTORY")
	if len(totozCacheDir) == 0 {
		log.Println("CACHETOTOZ_CACHE_DIRECTORY is not defined, totoz will be cached in a temporary directory")
		totozCacheDir, _ = os.MkdirTemp("", "cachetotoz")
	}
	cacheLastestTotozes()
}
