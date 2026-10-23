package main

import (
	"strings"
	"testing"
)

func TestParseTSVBackend(t *testing.T) {
	backend := "1\t20260926120000\tinfo\t\tmessage one\n" +
		"2\t20260926120001\tinfo\tlogin\tmessage two\n" +
		"not-a-number\t20260926120002\tinfo\t\tignored\n" +
		"3\t20260926120003\tinfo\n" + // missing fields
		"4\t20260926120004\tinfo\t\tmessage four\n"
	client := NewTribuneClient(nil)
	posts, err := client.parseTSVBackend(&Tribune{Name: "moules"}, strings.NewReader(backend))
	if err != nil {
		t.Fatal(err)
	}
	if len(posts) != 3 {
		t.Fatalf("parsed post count = %d, want 3", len(posts))
	}
	want := []Post{
		{ID: 1, Time: "20260926120000", Info: "info", Login: "", Message: "message one", Tribune: "moules"},
		{ID: 2, Time: "20260926120001", Info: "info", Login: "login", Message: "message two", Tribune: "moules"},
		{ID: 4, Time: "20260926120004", Info: "info", Login: "", Message: "message four", Tribune: "moules"},
	}
	for i := range want {
		if posts[i] != want[i] {
			t.Fatalf("posts[%d] = %+v, want %+v", i, posts[i], want[i])
		}
	}
}

func TestSplitTSVLineDropsExtraFields(t *testing.T) {
	record, ok := splitTSVLine("1\ttime\tinfo\tlogin\tmessage\twith\ttabs")
	if !ok {
		t.Fatal("splitTSVLine() did not parse a complete line")
	}
	if record[4] != "message" {
		t.Fatalf("message = %q, want %q (extra tabs are dropped, as before)", record[4], "message")
	}
	if _, ok := splitTSVLine("1\ttime\tinfo\tlogin"); ok {
		t.Fatal("splitTSVLine() accepted a line with fewer than five fields")
	}
	if record, ok := splitTSVLine("1\ttime\tinfo\t\t"); !ok || record[4] != "" {
		t.Fatalf("empty message field = %q, %t; want \\\"\\\", true", record[4], ok)
	}
}
