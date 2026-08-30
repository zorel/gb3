package main

import (
	"bufio"
	"fmt"
	"io"
	"io/fs"
	"log"
	"os"
	"path"
	"sort"
	"strconv"
	"sync/atomic"
	"time"
)

var timeLocation *time.Location

// Post a moule post
type Post struct {
	Time    string
	Info    string
	Message string
	ip      string
}

// Posts list
type Posts []Post

func (p Posts) Len() int           { return len(p) }
func (p Posts) Swap(i, j int)      { p[i], p[j] = p[j], p[i] }
func (p Posts) Less(i, j int) bool { return p[i].Time < p[j].Time }

func (p *Post) PrintTSV(w io.Writer) error {
	_, err := fmt.Fprintf(w, "%s\t%s\t%s\t\t%s\n", p.Time, p.Time, p.Info, p.Message)
	return err
}

func tsvSplit(data []byte, atEOF bool) (advance int, token []byte, err error) {
	for i, d := range data {
		if d == '\t' || d == '\n' {
			return i + 1, data[:i], nil
		}
	}
	if !atEOF {
		return 0, nil, nil
	}
	return 0, data, bufio.ErrFinalToken
}

func scanTsv(r io.Reader) (*Post, error) {
	scanner := bufio.NewScanner(r)
	scanner.Split(tsvSplit)
	scanner.Scan() // first field is useless id
	scanner.Scan()
	var p Post
	p.Time = scanner.Text()
	scanner.Scan()
	p.Info = scanner.Text()
	scanner.Scan() // next field is useless login
	scanner.Scan()
	p.Message = scanner.Text()
	return &p, scanner.Err()
}

func init() {
	initTimeLocation()
	initMaxPostsInHistory()
	initMaxDaysInHistory()
}

func initTimeLocation() {
	tl, err := time.LoadLocation("Europe/Paris")
	if nil != err {
		log.Println(err)
		timeLocation = time.UTC
	} else {
		timeLocation = tl
	}
}

var maxPostsInHistory = 200

func initMaxPostsInHistory() {
	value, isPresent := os.LookupEnv("GB0_MAX_POSTS_IN_HISTORY")
	if isPresent {
		intValue, err := strconv.Atoi(value)
		if nil != err {
			log.Println("Invalid value for GB0_MAX_POSTS_IN_HISTORY")
		} else {
			maxPostsInHistory = intValue
		}
	}
}

var maxDaysInHistory = 7

func initMaxDaysInHistory() {
	value, isPresent := os.LookupEnv("GB0_MAX_DAYS_IN_HISTORY")
	if isPresent {
		intValue, err := strconv.Atoi(value)
		if nil != err {
			log.Println("Invalid value for GB0_MAX_DAYS_IN_HISTORY")
		} else {
			maxDaysInHistory = intValue
		}
	}
}

// NewStore create posts store
func NewStore() (Store, error) {
	storeDirectory := os.Getenv("GB0_STORE_DIRECTORY")
	if len(storeDirectory) == 0 {
		log.Println("GB0_STORE_DIRECTORY is not defined, posts will be stored in temporary directory")
		storeDirectory, _ = os.MkdirTemp("", "gb0")
	}

	root, err := os.OpenRoot(storeDirectory)
	if err != nil {
		return nil, err
	}

	if err := root.MkdirAll("posts", 0o755); err != nil {
		root.Close()
		log.Fatalf("Cannot create posts directory, try to set GB0_STORE_DIRECTORY to a writable directory : %s\n", err)
	}
	if err := root.MkdirAll("tmp", 0o755); err != nil {
		root.Close()
		log.Fatalf("Cannot create tmp directory, try to set GB0_STORE_DIRECTORY to a writable directory : %s\n", err)
	}

	fileStore := &FileStore{root: root}
	fmt.Printf("Posts will be stored in %s/posts\n", fileStore.root.Name())
	return fileStore, nil
}

// Store posts
type Store interface {
	ReadPosts() (p Posts)
	WritePost(p *Post)
	Close()
}

// FileStore store posts in file
type FileStore struct {
	root    *os.Root
	counter atomic.Uint32
}

func (f *FileStore) Close() {
	f.root.Close()
}

// ReadPosts Load from file
func (f *FileStore) ReadPosts() Posts {
	posts := make(Posts, 0, maxPostsInHistory)
	now := time.Now().In(timeLocation)
	for day := 0; day <= maxDaysInHistory; day++ {
		dayTime := now.AddDate(0, 0, -day)
		dayDir := "posts/" + dayTime.Format("2006/01/02")
		posts = f.readPostsFromDirectory(posts, dayDir)
	}
	sort.Sort(posts)
	return posts
}

func (f *FileStore) readPostsFromDirectory(posts Posts, directory string) Posts {
	files, err := fs.Glob(f.root.FS(), directory+"/*.tsv")
	if nil != err {
		log.Printf("Cannot read posts from %s", directory)
		return make(Posts, 0)
	}
	sort.Sort(sort.Reverse(sort.StringSlice(files)))
	for _, file := range files {
		post, err := f.readPostFromFile(file)
		if nil == err {
			posts = append(posts, *post)
		} else {
			log.Printf("Cannot read posts from %s : %s", file, err)
		}
		if len(posts) >= maxPostsInHistory {
			break
		}
	}
	return posts
}

func (f *FileStore) readPostFromFile(file string) (*Post, error) {
	tsvFile, err := f.root.Open(file)
	if nil != err {
		return nil, err
	}
	defer tsvFile.Close() //nolint:errcheck
	var post *Post
	post, err = scanTsv(tsvFile)
	return post, err
}

const maxWritePostTry = 42

// WritePost Save to file
func (f *FileStore) WritePost(p *Post) {
	var err error
	for i := 1; i <= maxWritePostTry; i++ {
		err = f.tryToWritePost(p)
		if nil == err {
			log.Printf("New post %s from %s\n", p.Time, p.ip)
			return
		}
		log.Printf("Cannot write post %s from %s: %v (tentative %d of %d)\n", p.Time, p.ip, err, i, maxWritePostTry)
		time.Sleep(time.Duration(i) * time.Second)
	}
}

func (f *FileStore) tryToWritePost(p *Post) error {
	t := time.Now().In(timeLocation)
	p.Time = t.Format("20060102150405")
	tmpFileName := fmt.Sprintf("tmp/%s%d.tsv", p.Time, f.counter.Add(1))
	tmpFile, err := f.root.Create(tmpFileName)
	if nil != err {
		return err
	}
	defer f.root.Remove(tmpFileName) //nolint:errcheck
	if err := p.PrintTSV(tmpFile); err != nil {
		return fmt.Errorf("cannot write post: %w", err)
	}
	if err := tmpFile.Close(); err != nil {
		return fmt.Errorf("cannot write post: %w", err)
	}

	postDir := path.Join("posts", t.Format("2006/01/02"))
	if err := f.root.MkdirAll(postDir, 0o755); err != nil {
		return fmt.Errorf("cannot create directory %s: %w", postDir, err)
	}
	return f.root.Link(tmpFileName, path.Join(postDir, p.Time+".tsv"))
}
