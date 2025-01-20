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

func constainsById(posts Posts, id int64) bool {
	for _, p := range posts {
		if p.ID == id {
			return true
		}
	}
	return false
}

func appendUniquePosts(posts Posts, elements ...Post) Posts {
	for _, e := range elements {
		if !constainsById(posts, e.ID) {
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

// NewStore create store
func NewStore(maxPostsInHistory int) Store {
	return &memStore{postsMap: new(sync.Map), maxPostsInHistory: maxPostsInHistory}
}
