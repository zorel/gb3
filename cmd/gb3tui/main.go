package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type Post struct {
	ID      int64  `json:"id"`
	Time    string `json:"time"`
	Info    string `json:"info"`
	Login   string `json:"login"`
	Message string `json:"message"`
	Tribune string `json:"tribune"`
}

type postMessage Post
type sentMessage struct{ err error }
type streamError struct{ err error }

type postStream struct {
	posts  chan Post
	errors chan error
}

type model struct {
	client        *http.Client
	baseURL       string
	info          string
	tribunes      []string
	active        int
	blocked       map[string]bool
	gray          bool
	posts         map[string]Post
	input         textinput.Model
	scroll        int
	width, height int
	status        string
	stream        *postStream
}

var clockReference = regexp.MustCompile(`(?:(?:[0-9]{4}-[0-9]{2}-[0-9]{2}[T# ]|[0-9]{2}/[0-9]{2}#)?([0-9]{2}:[0-9]{2}:[0-9]{2})(?:@([a-z]+))?)`)
var anchorURL = regexp.MustCompile(`(?is)<a\s+[^>]*href=["']([^"']+)["'][^>]*>.*?</a>`)
var plainURL = regexp.MustCompile(`https?://[^\s<>"']+`)

var (
	titleStyle  = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#7D56F4"))
	mutedStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("#626262"))
	clockStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("#00BFA5"))
	nameStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("#FF9D00")).Bold(true)
	grayStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("#626262"))
	footerStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("#9A9A9A"))
)

func main() {
	baseURL := flag.String("url", "http://localhost:16666", "gb2c base URL")
	info := flag.String("info", defaultInfo(), "nickname or user-agent sent with posts")
	tribuneFlag := flag.String("tribunes", "", "comma-separated tribunes; empty means all")
	blockedFlag := flag.String("blocked", "", "comma-separated login/user-agent identities to hide")
	gray := flag.Bool("gray", false, "show filtered posts as gray rows with hidden messages")
	flag.Parse()

	client := &http.Client{Timeout: 0}
	tribunes := splitList(*tribuneFlag)
	if len(tribunes) == 0 {
		var err error
		tribunes, err = fetchTribunes(client, *baseURL)
		if err != nil {
			fatal(err)
		}
	}
	if len(tribunes) == 0 {
		fatal(errors.New("no tribune available"))
	}
	blockedIdentities := identitySet(*blockedFlag)
	for _, identity := range fetchBlockedIdentities(client, *baseURL) {
		blockedIdentities[identity] = true
	}

	input := textinput.New()
	input.Prompt = "  » "
	input.Placeholder = "write a post and press Enter"
	input.CharLimit = 65536
	input.Focus()

	stream := newPostStream(client, *baseURL, tribunes)
	m := model{
		client: client, baseURL: strings.TrimRight(*baseURL, "/"), info: *info,
		tribunes: tribunes, blocked: blockedIdentities, gray: *gray,
		posts: make(map[string]Post), input: input, stream: stream,
		status: "connected",
	}
	p := tea.NewProgram(m, tea.WithAltScreen(), tea.WithMouseCellMotion())
	if _, err := p.Run(); err != nil {
		fatal(err)
	}
}

func (m model) Init() tea.Cmd {
	return tea.Batch(textinput.Blink, m.waitForStream())
}

func (m model) waitForStream() tea.Cmd {
	return func() tea.Msg {
		select {
		case post := <-m.stream.posts:
			return postMessage(post)
		case err := <-m.stream.errors:
			return streamError{err: err}
		}
	}
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch message := msg.(type) {
	case tea.WindowSizeMsg:
		m.width, m.height = message.Width, message.Height
		m.input.Width = max(1, message.Width-4)
	case postMessage:
		post := Post(message)
		m.posts[postKey(post)] = post
		return m, m.waitForStream()
	case streamError:
		m.status = "reconnecting: " + message.err.Error()
		return m, m.waitForStream()
	case sentMessage:
		if message.err != nil {
			m.status = "post failed: " + message.err.Error()
		} else {
			m.status = "posted to " + m.tribunes[m.active]
		}
		return m, nil
	case tea.KeyMsg:
		switch message.String() {
		case "ctrl+c":
			return m, tea.Quit
		case "q":
			if m.input.Value() == "" {
				return m, tea.Quit
			}
			var cmd tea.Cmd
			m.input, cmd = m.input.Update(msg)
			return m, cmd
		case "tab", "right":
			m.active = (m.active + 1) % len(m.tribunes)
			m.scroll = 0
		case "shift+tab", "left":
			m.active = (m.active + len(m.tribunes) - 1) % len(m.tribunes)
			m.scroll = 0
		case "ctrl+u", "pgup":
			m.scroll += 4
		case "ctrl+d", "pgdown":
			m.scroll -= 4
		case "enter":
			value := strings.TrimSpace(m.input.Value())
			if value != "" {
				m.input.Reset()
				return m, sendPostCmd(m.client, m.baseURL, m.tribunes[m.active], m.info, value)
			}
		default:
			var cmd tea.Cmd
			m.input, cmd = m.input.Update(msg)
			return m, cmd
		}
	}
	if m.scroll < 0 {
		m.scroll = 0
	}
	return m, nil
}

func (m model) View() string {
	if m.width == 0 {
		return "connecting..."
	}
	posts := m.visiblePosts()
	contentHeight := m.height - 6
	if contentHeight < 1 {
		contentHeight = 1
	}
	scroll := m.scroll
	if scroll > len(posts)-contentHeight {
		scroll = len(posts) - contentHeight
	}
	if scroll < 0 {
		scroll = 0
	}
	start := len(posts) - contentHeight - scroll
	if start < 0 {
		start = 0
	}
	end := start + contentHeight
	if end > len(posts) {
		end = len(posts)
	}

	body := make([]string, 0, contentHeight)
	for _, post := range posts[start:end] {
		name := post.Login
		if name == "" {
			name = post.Info
		}
		line := fmt.Sprintf("%s  %s  %s", clockStyle.Render(post.Time[8:]), nameStyle.Render(name), clean(prettyMessage(post.Message)))
		if m.gray && post.Message == "[message hidden]" {
			line = grayStyle.Render(fmt.Sprintf("%s  %s  %s", post.Time[8:], name, post.Message))
		}
		body = append(body, lipgloss.NewStyle().Width(max(1, m.width-4)).Render(line))
	}
	for len(body) < contentHeight {
		body = append(body, "")
	}

	header := titleStyle.Render(" gb3 ") + " " + mutedStyle.Render("/ "+m.baseURL)
	tribune := lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#FFFFFF")).Background(lipgloss.Color("#5A3EC8")).Padding(0, 1).Render(m.tribunes[m.active])
	header = lipgloss.NewStyle().Width(m.width).Render(header + "   " + tribune + "   " + mutedStyle.Render(fmt.Sprintf("%d posts", len(posts))))
	footer := footerStyle.Render("Tab/←→ tribune  Ctrl-U/D scroll  Enter send  q quit")
	return header + "\n" + strings.Join(body, "\n") + "\n" + m.input.View() + mutedStyle.Render("  "+m.status) + "\n" + footer
}

func (m model) visiblePosts() []Post {
	all := make([]Post, 0, len(m.posts))
	for _, post := range m.posts {
		all = append(all, post)
	}
	sort.Slice(all, func(i, j int) bool { return all[i].ID < all[j].ID })
	hidden := make(map[string]bool)
	changed := true
	for changed {
		changed = false
		for _, post := range all {
			key := postKey(post)
			if hidden[key] || m.blocked[post.Login] || m.blocked[post.Info] {
				if !hidden[key] {
					hidden[key], changed = true, true
				}
				continue
			}
			for _, reference := range clockReference.FindAllStringSubmatch(post.Message, -1) {
				tribune := post.Tribune
				if reference[2] != "" {
					tribune = reference[2]
				}
				for _, target := range all {
					if target.Tribune == tribune && len(target.Time) >= 14 && target.Time[8:] == strings.ReplaceAll(reference[1], ":", "") && hidden[postKey(target)] {
						hidden[key], changed = true, true
					}
				}
			}
		}
	}

	visible := make([]Post, 0, len(all))
	for _, post := range all {
		if post.Tribune != m.tribunes[m.active] || hidden[postKey(post)] && !m.gray {
			continue
		}
		if hidden[postKey(post)] {
			post.Message = "[message hidden]"
		}
		visible = append(visible, post)
	}
	return visible
}

func newPostStream(client *http.Client, baseURL string, tribunes []string) *postStream {
	stream := &postStream{posts: make(chan Post, 64), errors: make(chan error, 1)}
	go func() {
		query := url.Values{}
		query.Set("filter", strings.Join(tribunes, ","))
		endpoint := strings.TrimRight(baseURL, "/") + "/gb2c/poll?" + query.Encode()
		for {
			response, err := client.Get(endpoint)
			if err != nil {
				stream.errors <- err
				time.Sleep(time.Second)
				continue
			}
			err = readEvents(bufio.NewReader(response.Body), stream.posts)
			response.Body.Close()
			if err != nil {
				stream.errors <- err
			}
			time.Sleep(time.Second)
		}
	}()
	return stream
}

func readEvents(reader *bufio.Reader, output chan<- Post) error {
	var data strings.Builder
	for {
		line, err := reader.ReadString('\n')
		if err != nil && len(line) == 0 {
			return err
		}
		line = strings.TrimRight(line, "\r\n")
		if strings.HasPrefix(line, "data:") {
			data.WriteString(strings.TrimSpace(strings.TrimPrefix(line, "data:")))
		} else if line == "" && data.Len() > 0 {
			var post Post
			if json.Unmarshal([]byte(data.String()), &post) == nil {
				output <- post
			}
			data.Reset()
		}
		if err != nil {
			return err
		}
	}
}

func sendPostCmd(client *http.Client, baseURL, tribune, info, message string) tea.Cmd {
	return func() tea.Msg {
		data := url.Values{"tribune": {tribune}, "info": {info}, "message": {message}}
		request, err := http.NewRequest(http.MethodPost, strings.TrimRight(baseURL, "/")+"/gb2c/post", strings.NewReader(data.Encode()))
		if err == nil {
			request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			var response *http.Response
			response, err = client.Do(request)
			if err == nil {
				defer response.Body.Close()
				if response.StatusCode >= 300 {
					err = fmt.Errorf("server returned %s", response.Status)
				}
			}
		}
		return sentMessage{err: err}
	}
}

func fetchTribunes(client *http.Client, baseURL string) ([]string, error) {
	response, err := client.Get(strings.TrimRight(baseURL, "/") + "/gb2c/list")
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tribune list returned %s", response.Status)
	}
	var tribunes []string
	if err := json.NewDecoder(response.Body).Decode(&tribunes); err != nil {
		return nil, err
	}
	sort.Strings(tribunes)
	return tribunes, nil
}

func fetchBlockedIdentities(client *http.Client, baseURL string) []string {
	response, err := client.Get(strings.TrimRight(baseURL, "/") + "/gb2c/config")
	if err != nil {
		return nil
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil
	}
	var config struct {
		BlockedIdentities []string `json:"blockedIdentities"`
	}
	if json.NewDecoder(response.Body).Decode(&config) != nil {
		return nil
	}
	return config.BlockedIdentities
}

func postKey(post Post) string { return post.Tribune + ":" + strconv.FormatInt(post.ID, 10) }

func defaultInfo() string {
	if value := os.Getenv("GB3_TUI_INFO"); value != "" {
		return value
	}
	if value := os.Getenv("USER"); value != "" {
		return value
	}
	return "gb3-tui"
}

func splitList(value string) []string {
	var result []string
	for _, item := range strings.Split(value, ",") {
		if item = strings.TrimSpace(item); item != "" {
			result = append(result, item)
		}
	}
	return result
}

func identitySet(value string) map[string]bool {
	result := make(map[string]bool)
	for _, item := range splitList(value) {
		result[item] = true
	}
	return result
}

func clean(value string) string {
	return strings.Map(func(character rune) rune {
		if character < 32 || character == 127 {
			return -1
		}
		return character
	}, strings.ReplaceAll(strings.ReplaceAll(value, "\r", " "), "\n", " "))
}

func prettyMessage(value string) string {
	value = anchorURL.ReplaceAllStringFunc(value, func(anchor string) string {
		matches := anchorURL.FindStringSubmatch(anchor)
		return urlLabel(matches[1])
	})
	return plainURL.ReplaceAllStringFunc(value, urlLabel)
}

func urlLabel(value string) string {
	core := strings.TrimRight(value, ".,!?;:)]")
	suffix := value[len(core):]
	parsed, err := url.Parse(core)
	if err != nil || parsed.Hostname() == "" {
		return value
	}
	return parsed.Hostname() + suffix
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
