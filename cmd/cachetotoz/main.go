package main

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/PuerkitoBio/goquery"
)

func cacheTotoz(totozUrl string) {
	fmt.Printf("Totoz %s\n", totozUrl)
	res, err := http.Get(totozUrl)
	if nil != err {
		log.Println(err)
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		log.Printf("Erreur de nsfw.totoz.eu : %d %s\n", res.StatusCode, res.Status)
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		log.Println(err)
	}

	totozName := doc.Find(".totoz .name").Text()
	totozTags := doc.Find(".totoz .tags").Text()
	fmt.Printf("Totoz %s with tags : %s\n", totozName, totozTags)

}

func cacheLastestTotozes() {
	res, err := http.Get("https://nsfw.totoz.eu/")
	if nil != err {
		log.Println(err)
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		log.Printf("Erreur de nsfw.totoz.eu : %d %s\n", res.StatusCode, res.Status)
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		log.Println(err)
	}

	doc.Find(".totoz .img").Each(func(i int, s *goquery.Selection) {
		totozHref, totozHrefExist := s.Attr("href")
		if !totozHrefExist {
			return
		}
		totozUrl, err := url.JoinPath("https://nsfw.totoz.eu", totozHref)
		if nil != err {
			log.Println(err)
			return
		}
		cacheTotoz(totozUrl)
		os.Exit(0) // TODO remove this
	})
}

func main() {
	cacheLastestTotozes()
}
