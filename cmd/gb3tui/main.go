package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"hash/fnv"
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
	"golang.org/x/net/html"
	"golang.org/x/net/html/atom"
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

type conversationGraph struct {
	parents  map[string][]string
	children map[string][]string
}

type conversationSpan struct {
	root, firstKey, lastKey string
	start, end, lane        int
}

type conversationLanes struct {
	spans     []conversationSpan
	byRoot    map[string]conversationSpan
	rootByKey map[string]string
	count     int
}

type inlineFormat struct {
	bold, italic, underline, strike bool
}

var clockReference = regexp.MustCompile(`(?:(?:[0-9]{4}-[0-9]{2}-[0-9]{2}[T# ]|[0-9]{2}/[0-9]{2}#)?([0-9]{2}:[0-9]{2}:[0-9]{2})(?:@([a-z]+))?)`)
var anchorURL = regexp.MustCompile(`(?is)<a\s+[^>]*href=["']([^"']+)["'][^>]*>.*?</a>`)
var plainURL = regexp.MustCompile(`https?://[^\s<>"']+`)
var inlineToken = regexp.MustCompile(`https?://[^\s<>"']+|(?:(?:[0-9]{4}-[0-9]{2}-[0-9]{2}[T# ]|[0-9]{2}/[0-9]{2}#)?[0-9]{2}:[0-9]{2}:[0-9]{2}(?:@[a-z]+)?)`)
var browserVersions = []struct {
	name       string
	expression *regexp.Regexp
}{
	{"Edge", regexp.MustCompile(`(?:Edg|EdgiOS|EdgA)/([0-9]+)`)},
	{"Opera", regexp.MustCompile(`(?:OPR|Opera)/([0-9]+)`)},
	{"Firefox", regexp.MustCompile(`(?:Firefox|FxiOS)/([0-9]+)`)},
	{"Chrome", regexp.MustCompile(`(?:Chrome|CriOS)/([0-9]+)`)},
	{"Safari", regexp.MustCompile(`Version/([0-9]+)(?:\.[0-9]+)*.*Safari/`)},
}

var (
	titleStyle   = lipgloss.NewStyle().Bold(true).Foreground(lipgloss.Color("#7D56F4"))
	mutedStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("#626262"))
	clockStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("#00BFA5"))
	urlStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("#5FAFFF")).Underline(true)
	nameStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("#FF9D00")).Bold(true)
	grayStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("#626262"))
	footerStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("#9A9A9A"))
	threadColors = []lipgloss.Color{
		"#FF5F87", "#5FAFFF", "#5FD787", "#FFD75F",
		"#AF87FF", "#FF875F", "#5FFFFF", "#D7AF5F",
	}
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
	graph := buildConversationGraph(m.allPosts())
	lanes := buildConversationLanes(posts, graph)
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
	for offset, post := range posts[start:end] {
		row := start + offset
		name := displayIdentity(post)
		gutter, laneStyle, inConversation := lanes.gutter(row, postKey(post))
		referenceStyle := clockStyle
		if inConversation {
			referenceStyle = laneStyle
		}
		line := fmt.Sprintf("%s%s  %s  %s", gutter, clockStyle.Render(post.Time[8:]), nameStyle.Render(name), styledMessageWithClockStyle(post.Message, referenceStyle))
		if m.gray && post.Message == "[message hidden]" {
			line = grayStyle.Render(fmt.Sprintf("%s%s  %s  %s", gutter, post.Time[8:], name, post.Message))
		}
		body = append(body, lipgloss.NewStyle().Width(max(1, m.width-2)).Render(line))
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
	all := m.allPosts()
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

func (m model) allPosts() []Post {
	all := make([]Post, 0, len(m.posts))
	for _, post := range m.posts {
		all = append(all, post)
	}
	sort.Slice(all, func(i, j int) bool { return all[i].ID < all[j].ID })
	return all
}

func buildConversationGraph(posts []Post) conversationGraph {
	graph := conversationGraph{
		parents:  make(map[string][]string),
		children: make(map[string][]string),
	}
	for _, post := range posts {
		child := postKey(post)
		for _, reference := range clockReference.FindAllStringSubmatch(post.Message, -1) {
			tribune := post.Tribune
			if reference[2] != "" {
				tribune = reference[2]
			}
			var parent string
			for _, candidate := range posts {
				if candidate.Tribune == tribune && len(candidate.Time) >= 14 && candidate.Time[8:] == strings.ReplaceAll(reference[1], ":", "") {
					parent = postKey(candidate)
				}
			}
			if parent != "" && parent != child && !contains(graph.parents[child], parent) {
				graph.parents[child] = append(graph.parents[child], parent)
				graph.children[parent] = append(graph.children[parent], child)
			}
		}
	}
	return graph
}

func buildConversationLanes(posts []Post, graph conversationGraph) conversationLanes {
	lanes := conversationLanes{
		byRoot:    make(map[string]conversationSpan),
		rootByKey: make(map[string]string),
	}
	for index, post := range posts {
		key := postKey(post)
		if len(graph.parents[key]) == 0 && len(graph.children[key]) == 0 {
			continue
		}
		root := graph.root(key)
		lanes.rootByKey[key] = root
		span, exists := lanes.byRoot[root]
		if !exists {
			span = conversationSpan{root: root, firstKey: key, start: index, end: index}
		}
		span.lastKey = key
		span.end = index
		lanes.byRoot[root] = span
	}

	spans := make([]conversationSpan, 0, len(lanes.byRoot))
	for _, span := range lanes.byRoot {
		spans = append(spans, span)
	}
	sort.Slice(spans, func(i, j int) bool {
		if spans[i].start == spans[j].start {
			return spans[i].root < spans[j].root
		}
		return spans[i].start < spans[j].start
	})
	laneEnds := make([]int, 0)
	for index := range spans {
		lane := -1
		for candidate, end := range laneEnds {
			if end < spans[index].start {
				lane = candidate
				break
			}
		}
		if lane < 0 {
			lane = len(laneEnds)
			laneEnds = append(laneEnds, spans[index].end)
		} else {
			laneEnds[lane] = spans[index].end
		}
		spans[index].lane = lane
		lanes.byRoot[spans[index].root] = spans[index]
	}
	lanes.spans = spans
	lanes.count = len(laneEnds)
	return lanes
}

func (lanes conversationLanes) gutter(row int, key string) (string, lipgloss.Style, bool) {
	root := lanes.rootByKey[key]
	own := lanes.byRoot[root]

	var gutter strings.Builder
	for lane := 0; lane < lanes.count; lane++ {
		marker := " "
		var active *conversationSpan
		for index := range lanes.spans {
			span := &lanes.spans[index]
			if span.lane == lane && row >= span.start && row <= span.end {
				active = span
				break
			}
		}
		if active != nil {
			marker = "│"
			if active.root == root {
				switch {
				case active.start == active.end:
					marker = "●"
				case row == active.start:
					marker = "┏"
				case row == active.end:
					marker = "┗"
				default:
					marker = "┣"
				}
			}
			gutter.WriteString(threadStyle(active.root).Render(marker))
		} else {
			gutter.WriteString(marker)
		}
	}
	gutter.WriteString(" ")
	if root == "" {
		return gutter.String(), lipgloss.Style{}, false
	}
	return gutter.String(), threadStyle(own.root), true
}

func (g conversationGraph) decoration(key string) (string, lipgloss.Style, bool) {
	if len(g.parents[key]) == 0 && len(g.children[key]) == 0 {
		return "", lipgloss.Style{}, false
	}
	marker := "┣"
	if len(g.parents[key]) == 0 {
		marker = "┏"
	} else if len(g.children[key]) == 0 {
		marker = "┗"
	}
	return marker, threadStyle(g.root(key)), true
}

func (g conversationGraph) root(key string) string {
	seen := make(map[string]bool)
	for len(g.parents[key]) > 0 && !seen[key] {
		seen[key] = true
		key = g.parents[key][0]
	}
	return key
}

func threadStyle(root string) lipgloss.Style {
	hash := fnv.New32a()
	_, _ = hash.Write([]byte(root))
	color := threadColors[int(hash.Sum32())%len(threadColors)]
	return lipgloss.NewStyle().Foreground(color).Bold(true)
}

func contains(values []string, wanted string) bool {
	for _, value := range values {
		if value == wanted {
			return true
		}
	}
	return false
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

func displayIdentity(post Post) string {
	if post.Login != "" {
		return post.Login
	}
	return shortBrowserUserAgent(post.Info)
}

func shortBrowserUserAgent(userAgent string) string {
	for _, browser := range browserVersions {
		matches := browser.expression.FindStringSubmatch(userAgent)
		if len(matches) < 2 {
			continue
		}
		identity := browser.name + " " + matches[1]
		if platform := browserPlatform(userAgent); platform != "" {
			identity += " · " + platform
		}
		return identity
	}
	return userAgent
}

func browserPlatform(userAgent string) string {
	switch {
	case strings.Contains(userAgent, "Android"):
		return "Android"
	case strings.Contains(userAgent, "iPad"):
		return "iPadOS"
	case strings.Contains(userAgent, "iPhone"), strings.Contains(userAgent, "iPod"):
		return "iOS"
	case strings.Contains(userAgent, "Windows"):
		return "Windows"
	case strings.Contains(userAgent, "CrOS"):
		return "ChromeOS"
	case strings.Contains(userAgent, "Macintosh"), strings.Contains(userAgent, "Mac OS X"):
		return "macOS"
	case strings.Contains(userAgent, "Linux"):
		return "Linux"
	default:
		return ""
	}
}

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

func styledMessage(value string) string {
	return styledMessageWithClockStyle(value, clockStyle)
}

func styledMessageWithClockStyle(value string, referenceStyle lipgloss.Style) string {
	context := &html.Node{Type: html.ElementNode, Data: "div", DataAtom: atom.Div}
	nodes, err := html.ParseFragment(strings.NewReader(value), context)
	if err != nil {
		return renderStyledText(value, inlineFormat{}, referenceStyle)
	}
	var rendered strings.Builder
	for _, node := range nodes {
		rendered.WriteString(renderHTMLNode(node, inlineFormat{}, referenceStyle))
	}
	return rendered.String()
}

func renderHTMLNode(node *html.Node, format inlineFormat, referenceStyle lipgloss.Style) string {
	if node.Type == html.TextNode {
		return renderStyledText(node.Data, format, referenceStyle)
	}
	if node.Type != html.ElementNode {
		return ""
	}

	switch strings.ToLower(node.Data) {
	case "b", "strong":
		format.bold = true
	case "i", "em":
		format.italic = true
	case "u":
		format.underline = true
	case "s", "strike", "del":
		format.strike = true
	case "a":
		for _, attribute := range node.Attr {
			if strings.EqualFold(attribute.Key, "href") {
				style := format.style().Foreground(urlStyle.GetForeground()).Underline(true)
				return style.Render(urlLabel(attribute.Val))
			}
		}
	case "br":
		return " "
	case "script", "style":
		return ""
	}

	var rendered strings.Builder
	for child := node.FirstChild; child != nil; child = child.NextSibling {
		rendered.WriteString(renderHTMLNode(child, format, referenceStyle))
	}
	return rendered.String()
}

func renderStyledText(value string, format inlineFormat, referenceStyle lipgloss.Style) string {
	value = clean(value)
	indices := inlineToken.FindAllStringIndex(value, -1)
	if len(indices) == 0 {
		return format.style().Render(value)
	}
	var rendered strings.Builder
	position := 0
	for _, index := range indices {
		rendered.WriteString(format.style().Render(value[position:index[0]]))
		token := value[index[0]:index[1]]
		style := format.style()
		if plainURL.MatchString(token) {
			style = style.Foreground(urlStyle.GetForeground()).Underline(true)
			token = urlLabel(token)
		} else {
			style = style.Foreground(referenceStyle.GetForeground()).Bold(true)
		}
		rendered.WriteString(style.Render(token))
		position = index[1]
	}
	rendered.WriteString(format.style().Render(value[position:]))
	return rendered.String()
}

func (format inlineFormat) style() lipgloss.Style {
	return lipgloss.NewStyle().
		Bold(format.bold).
		Italic(format.italic).
		Underline(format.underline).
		Strikethrough(format.strike)
}

func urlLabel(value string) string {
	core := strings.TrimRight(value, ".,!?;:)]")
	suffix := value[len(core):]
	parsed, err := url.Parse(core)
	if err != nil || parsed.Hostname() == "" {
		return value
	}
	return parsed.Scheme + "://" + parsed.Host + suffix
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
