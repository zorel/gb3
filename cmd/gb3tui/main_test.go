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

func TestStyledMessageRendersSupportedHTMLTags(t *testing.T) {
	got := styledMessage("<b>bold <i>italic</i></b> <u>underlined</u> <s>gone</s>")
	for _, text := range []string{"bold", "italic", "underlined", "gone"} {
		if !strings.Contains(got, text) {
			t.Fatalf("styledMessage() = %q, missing %q", got, text)
		}
	}
	if strings.Contains(got, "<b>") || strings.Contains(got, "<i>") || strings.Contains(got, "<u>") || strings.Contains(got, "<s>") {
		t.Fatalf("styledMessage() = %q, contains raw HTML tags", got)
	}
}

func TestInlineFormatMapsToLipgloss(t *testing.T) {
	style := (inlineFormat{bold: true, italic: true, underline: true, strike: true}).style()
	if !style.GetBold() || !style.GetItalic() || !style.GetUnderline() || !style.GetStrikethrough() {
		t.Fatal("inline format did not enable every requested terminal style")
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

func TestShortBrowserUserAgent(t *testing.T) {
	tests := []struct {
		userAgent string
		want      string
	}{
		{
			"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
			"Chrome 140 · Linux",
		},
		{
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
			"Edge 140 · Windows",
		},
		{
			"Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1",
			"Safari 18 · iOS",
		},
		{
			"Mozilla/5.0 (Android 16; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0",
			"Firefox 143 · Android",
		},
	}
	for _, test := range tests {
		if got := shortBrowserUserAgent(test.userAgent); got != test.want {
			t.Errorf("shortBrowserUserAgent() = %q, want %q", got, test.want)
		}
	}
}

func TestShortBrowserUserAgentKeepsCustomInfo(t *testing.T) {
	const info = "coincoin-from-the-future"
	if got := shortBrowserUserAgent(info); got != info {
		t.Fatalf("shortBrowserUserAgent() = %q, want %q", got, info)
	}
}
