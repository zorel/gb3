package main

import (
	"log"
	"sort"
	"sync"
)

func init() {
	storeMap["memory"] = NewMemStore
	storeMap[""] = NewMemStore // Default store implementation
}

// memTribune holds the posts of a single tribune together with the set of
// known post IDs so deduplication does not need a scan of every stored post.
type memTribune struct {
	mu    sync.RWMutex
	posts Posts
	ids   map[int64]struct{}
}

type memStore struct {
	tribunes          sync.Map // tribune name -> *memTribune
	maxPostsInHistory int      //  number of latests posts to store
}

func (m *memStore) loadTribune(tribune string) *memTribune {
	value, _ := m.tribunes.LoadOrStore(tribune, &memTribune{ids: make(map[int64]struct{})})
	return value.(*memTribune)
}

func (m *memStore) Save(tribune string, posts Posts) error {
	t := m.loadTribune(tribune)
	t.mu.Lock()
	defer t.mu.Unlock()

	added := false
	for _, p := range posts {
		if _, ok := t.ids[p.ID]; ok {
			continue
		}
		t.ids[p.ID] = struct{}{}
		t.posts = append(t.posts, p)
		added = true
	}
	if !added {
		return nil
	}

	sort.Sort(t.posts)
	if len(t.posts) > m.maxPostsInHistory {
		for _, p := range t.posts[:len(t.posts)-m.maxPostsInHistory] {
			delete(t.ids, p.ID)
		}
		trimmed := make(Posts, m.maxPostsInHistory)
		copy(trimmed, t.posts[len(t.posts)-m.maxPostsInHistory:])
		t.posts = trimmed
	}
	return nil
}

func (m *memStore) RetrieveLatests(tribune string) (Posts, error) {
	t := m.loadTribune(tribune)
	t.mu.RLock()
	defer t.mu.RUnlock()
	posts := make(Posts, len(t.posts))
	copy(posts, t.posts)
	return posts, nil
}

// NewMemStore creates a memory-backed store
func NewMemStore() (Store, error) {
	maxPostsInHistory := getIntFromEnv("GB2C_MAX_POSTS_IN_HISTORY", 200)

	log.Println("Using in-memory store")
	return &memStore{maxPostsInHistory: maxPostsInHistory}, nil
}
