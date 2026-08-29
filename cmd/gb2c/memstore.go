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

type memStore struct {
	postsMap          *sync.Map
	maxPostsInHistory int //  number of latests posts to store
}

func containsByID(posts Posts, id int64) bool {
	for _, p := range posts {
		if p.ID == id {
			return true
		}
	}
	return false
}

func appendUniquePosts(posts Posts, elements ...Post) Posts {
	for _, e := range elements {
		if !containsByID(posts, e.ID) {
			posts = append(posts, e)
		}
	}
	return posts
}

func (m memStore) Save(tribune string, posts Posts) error {
	newPosts := make(Posts, 0, m.maxPostsInHistory)
	oldPosts, ok := m.postsMap.Load(tribune)
	if ok {
		newPosts = append(newPosts, oldPosts.(Posts)...)
		newPosts = appendUniquePosts(newPosts, posts...)
	} else {
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
func NewMemStore() (Store, error) {
	maxPostsInHistory := getIntFromEnv("GB2C_MAX_POSTS_IN_HISTORY", 200)

	log.Println("Using in-memory store")
	return &memStore{postsMap: new(sync.Map), maxPostsInHistory: maxPostsInHistory}, nil
}
