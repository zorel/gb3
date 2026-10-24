package main

import (
	"fmt"
	"sync"
	"testing"
)

func newTestMemStore(t *testing.T, maxPostsInHistory int) Store {
	t.Helper()
	store, err := NewMemStore()
	if err != nil {
		t.Fatalf("NewMemStore() error = %v", err)
	}
	store.(*memStore).maxPostsInHistory = maxPostsInHistory
	return store
}

func makeLatestPosts(count int) Posts {
	posts := make(Posts, count)
	for i := range posts {
		posts[i] = Post{ID: int64(i + 1), Time: fmt.Sprintf("2026092612%02d%02d", i/60%60, i%60), Tribune: "moules"}
	}
	return posts
}

func TestMemStoreDeduplicatesPosts(t *testing.T) {
	store := newTestMemStore(t, 10)
	posts := makeLatestPosts(3)
	if err := store.Save("moules", posts); err != nil {
		t.Fatal(err)
	}
	if err := store.Save("moules", posts); err != nil {
		t.Fatal(err)
	}
	latest, err := store.RetrieveLatests("moules")
	if err != nil {
		t.Fatal(err)
	}
	if len(latest) != 3 {
		t.Fatalf("stored post count = %d, want 3", len(latest))
	}
}

func TestMemStoreKeepsLatestPosts(t *testing.T) {
	store := newTestMemStore(t, 5)
	if err := store.Save("moules", makeLatestPosts(8)); err != nil {
		t.Fatal(err)
	}
	latest, err := store.RetrieveLatests("moules")
	if err != nil {
		t.Fatal(err)
	}
	if len(latest) != 5 {
		t.Fatalf("stored post count = %d, want 5", len(latest))
	}
	if latest[0].ID != 4 || latest[4].ID != 8 {
		t.Fatalf("kept post ids = %d..%d, want 4..8", latest[0].ID, latest[4].ID)
	}

	// A post that was trimmed away must be accepted again later on.
	if err := store.Save("moules", makeLatestPosts(1)); err != nil {
		t.Fatal(err)
	}
	latest, err = store.RetrieveLatests("moules")
	if err != nil {
		t.Fatal(err)
	}
	for _, post := range latest {
		if post.ID == 1 {
			t.Fatal("a previously trimmed post should be insertable again")
		}
	}
}

func TestMemStoreRetrievalIsASnapshot(t *testing.T) {
	store := newTestMemStore(t, 5)
	if err := store.Save("moules", makeLatestPosts(2)); err != nil {
		t.Fatal(err)
	}
	latest, err := store.RetrieveLatests("moules")
	if err != nil {
		t.Fatal(err)
	}
	latest[0].Message = "mutated"
	again, err := store.RetrieveLatests("moules")
	if err != nil {
		t.Fatal(err)
	}
	if again[0].Message == "mutated" {
		t.Fatal("RetrieveLatests leaked the internal slice")
	}
}

func TestMemStoreConcurrentAccess(t *testing.T) {
	store := newTestMemStore(t, 50)
	posts := makeLatestPosts(120)
	var group sync.WaitGroup
	for worker := 0; worker < 8; worker++ {
		group.Add(2)
		go func(worker int) {
			defer group.Done()
			for i := worker; i < len(posts); i += 8 {
				if err := store.Save("moules", Posts{posts[i]}); err != nil {
					t.Errorf("Save: %v", err)
					return
				}
			}
		}(worker)
		go func() {
			defer group.Done()
			for i := 0; i < 100; i++ {
				if _, err := store.RetrieveLatests("moules"); err != nil {
					t.Errorf("RetrieveLatests: %v", err)
					return
				}
			}
		}()
	}
	group.Wait()

	latest, err := store.RetrieveLatests("moules")
	if err != nil {
		t.Fatal(err)
	}
	if len(latest) != 50 {
		t.Fatalf("stored post count = %d, want 50", len(latest))
	}
	if latest[49].ID != 120 {
		t.Fatalf("latest post id = %d, want 120", latest[49].ID)
	}
}
