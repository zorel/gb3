//go:build sqlite

package main

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"path"
	"slices"
	"time"

	_ "modernc.org/sqlite"
)

func init() {
	storeMap["sqlite"] = NewSqliteStore
}

type newPosts struct {
	tribune string
	posts   Posts
}

type SqliteStore struct {
	db                *sql.DB
	location          *time.Location
	maxPostsInHistory int // number of posts to return in RetrieveLatest()
	maxPostsInStorage int // number of posts to store in the database
	newPosts          chan newPosts
}

func parsePostTime(postTime string, location *time.Location) (time.Time, error) {
	return time.ParseInLocation("20060102150405", postTime, location)
}

func formatPostTime(postTime time.Time, location *time.Location) string {
	return postTime.In(location).Format("20060102150405")
}

func initSqliteDatabase(db *sql.DB) error {
	_, err := db.Exec(`
		PRAGMA journal_mode = WAL;
		PRAGMA busy_timeout = 5000;
		PRAGMA synchronous = NORMAL;
		PRAGMA cache_size = -64000;
		PRAGMA foreign_keys = TRUE;
		PRAGMA temp_store = MEMORY;
	`)
	if err != nil {
		return fmt.Errorf("failed initialize database: %w", err)
	}

	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS posts (
			Tribune TEXT,
			ID INTEGER,
			Time DATETIME,
			Info TEXT,
			Login TEXT,
			Message TEXT,
			PRIMARY KEY (Tribune, ID)
		);`)
	if err != nil {
		return fmt.Errorf("failed to create posts table: %v", err)
	}

	_, err = db.Exec(`CREATE INDEX IF NOT EXISTS tribune_and_time_idx ON posts (Tribune, Time);`)
	if err != nil {
		return fmt.Errorf("failed to create index on posts table: %v", err)
	}

	return nil
}

func NewSqliteStore() (Store, error) {
	var err error
	dbPath := os.Getenv("GB2C_SQLITE_PATH")
	if dbPath == "" {
		dbPath, err = os.MkdirTemp("", "gb2c")
		if err != nil {
			return nil, fmt.Errorf("could not create temporary store directory: %v", err)
		}
		dbPath = path.Join(dbPath, "posts.sqlite")
	}

	maxPostsInHistory := getIntFromEnv("GB2C_MAX_POSTS_IN_HISTORY", 200)
	maxPostsInStorage := getIntFromEnv("GB2C_SQLITE_MAX_POSTS_IN_STORAGE", maxPostsInHistory)

	db, err := sql.Open("sqlite", dbPath+"?_txlock=immediate")
	if err != nil {
		return nil, fmt.Errorf("failed to open SQLite database: %v", err)
	}

	if err := initSqliteDatabase(db); err != nil {
		return nil, err
	}

	location, err := time.LoadLocation("Europe/Paris")
	if err != nil {
		return nil, fmt.Errorf("failed to load time location: %v", err)
	}

	log.Printf("Using SQLite store in %s\n", dbPath)
	store := &SqliteStore{
		db:                db,
		location:          location,
		maxPostsInHistory: maxPostsInHistory,
		maxPostsInStorage: maxPostsInStorage,
		newPosts:          make(chan newPosts),
	}

	go func() {
		for s := range store.newPosts {
			if err := store.savePosts(s.tribune, s.posts); err != nil {
				log.Printf("Error while saving posts: %v\n", err)
			}
		}
	}()

	return store, nil
}

func (s *SqliteStore) Save(tribune string, posts Posts) error {
	s.newPosts <- newPosts{tribune, posts}
	return nil
}

func (s *SqliteStore) savePosts(tribune string, posts Posts) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`INSERT OR IGNORE INTO posts (Tribune, ID, Time, Info, Login, Message) VALUES (?, ?, ?, ?, ?, ?);`)
	if err != nil {
		return err
	}

	var errs []error
	for _, post := range posts {
		postTime, err := parsePostTime(post.Time, s.location)
		if err != nil {
			errs = append(errs, err)
			continue
		}

		_, err = stmt.Exec(post.Tribune, post.ID, postTime, post.Info, post.Login, post.Message)
		if err != nil {
			errs = append(errs, err)
		}
	}
	if len(errs) > 0 {
		return errors.Join(errs...)
	}

	if s.maxPostsInStorage > 0 {
		_, err := tx.Exec(
			`DELETE FROM posts WHERE Tribune = ? AND ROWID < (SELECT ROWID FROM posts WHERE Tribune = ? ORDER BY ROWID DESC LIMIT ?, 1)`,
			tribune,
			s.maxPostsInStorage,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *SqliteStore) RetrieveLatests(tribune string) (Posts, error) {
	rows, err := s.db.Query(
		`SELECT ID, Time, Info, Login, Message FROM posts WHERE Tribune = ? ORDER BY ID DESC LIMIT ?`,
		tribune,
		s.maxPostsInHistory,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve latest posts: %v", err)
	}
	defer rows.Close()

	posts := make(Posts, 0, s.maxPostsInHistory)
	for rows.Next() {
		p := Post{Tribune: tribune}
		var postTime time.Time
		if err := rows.Scan(&p.ID, &postTime, &p.Info, &p.Login, &p.Message); err != nil {
			fmt.Printf("failed to scan post row: %v", err)
			return nil, fmt.Errorf("failed to scan post row: %v", err)
		}
		p.Time = formatPostTime(postTime, s.location)
		posts = append(posts, p)
	}

	slices.Reverse(posts)

	return posts, nil
}
