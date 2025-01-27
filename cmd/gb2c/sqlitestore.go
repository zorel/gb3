package main

import (
	"database/sql"
	"fmt"
	"sort"
	"time"
)

type SqliteStore struct {
	db                *sql.DB
	location          *time.Location
	maxPostsInHistory int // number of posts to return in RetrieveLatest()
	maxPostsInStorage int // number of posts to store in the database
}

func parsePostTime(postTime string, location *time.Location) (time.Time, error) {
	return time.ParseInLocation("20060102150405", postTime, location)
}

func formatPostTime(postTime time.Time, location *time.Location) string {
	return postTime.In(location).Format("20060102150405")
}

func NewSqliteStore(dbPath string, maxPostsInHistory int, maxPostsInStorage int) (Store, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open SQLite database: %v", err)
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
		return nil, fmt.Errorf("failed to create posts table: %v", err)
	}

	_, err = db.Exec(`CREATE INDEX IF NOT EXISTS tribune_and_time_idx ON posts (Tribune, Time);`)
	if err != nil {
		return nil, fmt.Errorf("failed to create index on posts table: %v", err)
	}

	location, err := time.LoadLocation("Europe/Paris")
	if err != nil {
		return nil, fmt.Errorf("failed to load time location: %v", err)
	}

	return &SqliteStore{
		db:                db,
		location:          location,
		maxPostsInHistory: maxPostsInHistory,
		maxPostsInStorage: maxPostsInStorage,
	}, nil
}

func (s *SqliteStore) Save(tribune string, posts Posts) error {
	stmt, err := s.db.Prepare(`INSERT OR IGNORE INTO posts (Tribune, ID, Time, Info, Login, Message) VALUES (?, ?, ?, ?, ?, ?);`)
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
		// FIXME: In Go 1.20+, replace the following with: return errors.Join(errs...)
		return fmt.Errorf("%v", errs)
	}

	if s.maxPostsInStorage > 0 {
		_, err := s.db.Exec(
			`DELETE FROM posts WHERE Tribune = ? AND ROWID < (SELECT ROWID FROM posts WHERE Tribune = ? ORDER BY ROWID DESC LIMIT ?, 1)`,
			tribune,
			s.maxPostsInStorage,
		)
		if err != nil {
			return err
		}
	}

	return nil
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

	// FIXME: In Go 1.21+, replace the following with:slices.Reverse(posts)
	sort.Sort(posts)

	return posts, nil
}
