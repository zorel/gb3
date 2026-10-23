package main

import (
	"database/sql"
	"fmt"
	"sort"
	"time"
)

type SqliteStore struct {
	db                *sql.DB
	insertStmt        *sql.Stmt
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
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open SQLite database: %v", err)
	}

	// SQLite only supports one writer at a time. Serializing access through a
	// single connection avoids SQLITE_BUSY errors when tribunes are saved
	// concurrently.
	db.SetMaxOpenConns(1)

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

	stmt, err := db.Prepare(`INSERT OR IGNORE INTO posts (Tribune, ID, Time, Info, Login, Message) VALUES (?, ?, ?, ?, ?, ?);`)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare insert statement: %v", err)
	}

	return &SqliteStore{
		db:                db,
		insertStmt:        stmt,
		location:          location,
		maxPostsInHistory: maxPostsInHistory,
		maxPostsInStorage: maxPostsInStorage,
	}, nil
}

func (s *SqliteStore) Save(tribune string, posts Posts) error {
	if len(posts) == 0 {
		return nil
	}

	if len(posts) == 1 {
		// A transaction would only add overhead for a single row.
		if err := s.insertPosts(tribune, posts); err != nil {
			return err
		}
		return s.trim(tribune)
	}

	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := s.insertPostsTx(tx, tribune, posts); err != nil {
		return err
	}

	if s.maxPostsInStorage > 0 {
		if _, err := tx.Exec(
			`DELETE FROM posts WHERE Tribune = ? AND ID <= (SELECT ID FROM posts WHERE Tribune = ? ORDER BY ID DESC LIMIT 1 OFFSET ?)`,
			tribune,
			tribune,
			s.maxPostsInStorage,
		); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (s *SqliteStore) insertPosts(tribune string, posts Posts) error {
	var errs []error
	for _, post := range posts {
		postTime, err := parsePostTime(post.Time, s.location)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		if _, err := s.insertStmt.Exec(post.Tribune, post.ID, postTime, post.Info, post.Login, post.Message); err != nil {
			errs = append(errs, err)
		}
	}
	return joinErrors(errs)
}

func (s *SqliteStore) insertPostsTx(tx *sql.Tx, tribune string, posts Posts) error {
	// Reuse the statement prepared once in NewSqliteStore, bound to this transaction.
	stmt := tx.Stmt(s.insertStmt)
	defer stmt.Close()

	var errs []error
	for _, post := range posts {
		postTime, err := parsePostTime(post.Time, s.location)
		if err != nil {
			errs = append(errs, err)
			continue
		}
		if _, err := stmt.Exec(post.Tribune, post.ID, postTime, post.Info, post.Login, post.Message); err != nil {
			errs = append(errs, err)
		}
	}
	return joinErrors(errs)
}

func (s *SqliteStore) trim(tribune string) error {
	if s.maxPostsInStorage <= 0 {
		return nil
	}
	_, err := s.db.Exec(
		`DELETE FROM posts WHERE Tribune = ? AND ID <= (SELECT ID FROM posts WHERE Tribune = ? ORDER BY ID DESC LIMIT 1 OFFSET ?)`,
		tribune,
		tribune,
		s.maxPostsInStorage,
	)
	return err
}

func joinErrors(errs []error) error {
	if len(errs) == 0 {
		return nil
	}
	// FIXME: In Go 1.20+, replace the following with: return errors.Join(errs...)
	return fmt.Errorf("%v", errs)
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

	return posts, rows.Err()
}
