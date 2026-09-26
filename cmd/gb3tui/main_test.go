package main

import (
	"strings"
	"testing"
)

func TestPrettyMessageShortensAnchorsAndURLs(t *testing.T) {
	message := `voir <a href="https://example.org/a/very/long/path">le site</a> ou https://example.net/a/long/path.`
	want := "voir https://example.org ou https://example.net."
	if got := prettyMessage(message); got != want {
		t.Fatalf("prettyMessage() = %q, want %q", got, want)
	}
}

func TestPrettyMessageKeepsNonHTTPURLs(t *testing.T) {
	message := "git@github.com:devnewton/gb3"
	if got := prettyMessage(message); got != message {
		t.Fatalf("prettyMessage() = %q, want %q", got, message)
	}
}

func TestStyledMessageColorsURLsAndClocks(t *testing.T) {
	got := styledMessage("voir https://example.org/path à 12:34:56")
	if !strings.Contains(got, "https://example.org") || !strings.Contains(got, "12:34:56") {
		t.Fatalf("styledMessage() = %q, missing shortened content", got)
	}
}

func TestConversationGraphConnectsRepliesToTheirRoot(t *testing.T) {
	posts := []Post{
		{ID: 1, Time: "20260926120000", Tribune: "moules", Message: "root"},
		{ID: 2, Time: "20260926120100", Tribune: "moules", Message: "12:00:00 reply"},
		{ID: 3, Time: "20260926120200", Tribune: "moules", Message: "12:01:00 reply again"},
	}
	graph := buildConversationGraph(posts)
	root := postKey(posts[0])
	if got := graph.root(postKey(posts[2])); got != root {
		t.Fatalf("root() = %q, want %q", got, root)
	}
	rootMarker, _, ok := graph.decoration(root)
	if !ok || rootMarker != "┏" {
		t.Fatalf("root decoration = %q, %t; want ┏, true", rootMarker, ok)
	}
	leafMarker, _, ok := graph.decoration(postKey(posts[2]))
	if !ok || leafMarker != "┗" {
		t.Fatalf("leaf decoration = %q, %t; want ┗, true", leafMarker, ok)
	}
}
