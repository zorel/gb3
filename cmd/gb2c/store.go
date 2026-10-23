package main

import (
	"sort"
	"sync"
)

// Store tribune's posts
type Store interface {
	Save(tribune string, posts Posts) error
	RetrieveLatests(tribune string) (Posts, error)
}

type memStore struct {
	postsMap          *sync.Map
	maxPostsInHistory int //  number of latests posts to store
}

func (m memStore) Save(tribune string, posts Posts) error {
	var newPosts Posts
	oldPosts, ok := m.postsMap.Load(tribune)
	if ok {
		existing := oldPosts.(Posts)
		newPosts = make(Posts, 0, len(existing)+len(posts))
		newPosts = append(newPosts, existing...)
		seen := make(map[int64]struct{}, len(existing))
		for _, p := range existing {
			seen[p.ID] = struct{}{}
		}
		for _, p := range posts {
			if _, ok := seen[p.ID]; ok {
				continue
			}
			seen[p.ID] = struct{}{}
			newPosts = append(newPosts, p)
		}
	} else {
		newPosts = make(Posts, 0, len(posts))
		newPosts = append(newPosts, posts...)
	}
	sort.Sort(newPosts)
	if len(newPosts) > m.maxPostsInHistory {
		newPosts = newPosts[len(newPosts)-m.maxPostsInHistory:]
	}
	m.postsMap.Store(tribune, newPosts)
	return nil
}

func (m memStore) RetrieveLatests(tribune string) (Posts, error) {
	posts, _ := m.postsMap.LoadOrStore(tribune, make(Posts, 0, m.maxPostsInHistory))
	return posts.(Posts), nil
}

// NewMemStore creates a memory-backed store
func NewMemStore(maxPostsInHistory int) Store {
	return &memStore{postsMap: new(sync.Map), maxPostsInHistory: maxPostsInHistory}
}
