package main

import "testing"

func TestPrettyMessageShortensAnchorsAndURLs(t *testing.T) {
	message := `voir <a href="https://example.org/a/very/long/path">le site</a> ou https://example.net/a/long/path.`
	want := "voir example.org ou example.net."
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
