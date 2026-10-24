package main

import (
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const (
	maxAttachmentSize      = 4 * 1024 * 1024
	attachmentEndpointPath = "/gb2c/attachment/"
)

type AttachmentHandler struct {
	attachmentDirectory string
}

func (a *AttachmentHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		a.postAttachment(w, r)
	} else {
		a.getAttachment(w, r)
	}
}

func generateAttachmentIDBase() string {
	return strconv.FormatInt(time.Now().Unix(), 10)
}

var attachmentIDRegex = regexp.MustCompile(`\d+(\.[a-zA-Z0-9]{1,4})?`)

func isAttachmentID(attachmentID string) bool {
	return attachmentIDRegex.MatchString(attachmentID)
}

func (a *AttachmentHandler) deleteOldAttachments() {
	cleanupTime := time.Now().Add(-48 * time.Hour)

	root, err := os.OpenRoot(a.attachmentDirectory)
	if err != nil {
		log.Printf("Could not open attachment directory: %v\n", err)
		return
	}
	defer root.Close()

	err = fs.WalkDir(root.FS(), ".", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if !d.IsDir() {
			info, err := d.Info()
			if nil != err {
				return err
			}
			if info.ModTime().Before(cleanupTime) {
				return root.Remove(path)
			}
		}
		return nil
	})
	if nil != err {
		log.Println("Error during attachment cleanup: ", err)
	}
}

func (a *AttachmentHandler) postAttachment(w http.ResponseWriter, r *http.Request) {
	a.deleteOldAttachments()
	attachmentID := generateAttachmentIDBase()
	attachmentFormFile, _, err := r.FormFile("attachment")
	if nil != err {
		http.Error(w, fmt.Sprintf("No attachment file in request: %s", err), http.StatusBadRequest)
		return
	}
	defer attachmentFormFile.Close()

	header := make([]byte, 512)
	_, err = attachmentFormFile.Read(header)
	if nil != err {
		http.Error(w, "Cannot read attachment header", http.StatusBadRequest)
		return
	}

	mimeType := http.DetectContentType(header)
	switch mimeType {
	case "image/gif":
		attachmentID += ".gif"
	case "image/png":
		attachmentID += ".png"
	case "image/jpeg":
		attachmentID += ".jpeg"
	case "image/webp":
		attachmentID += ".webp"
	case "audio/mpeg":
		attachmentID += ".mp3"
	case "application/ogg":
		attachmentID += ".ogg"
	case "video/webm":
		attachmentID += ".webm"
	}

	root, err := os.OpenRoot(a.attachmentDirectory)
	if err != nil {
		http.Error(w, "Cannot create attachment file", http.StatusInternalServerError)
		log.Println("Cannot create attachment file: ", err)
		return
	}
	defer root.Close()

	attachmentDestFile, err := root.Create(attachmentID)
	if nil != err {
		http.Error(w, "Cannot create attachment file", http.StatusInternalServerError)
		log.Println("Cannot create attachment file: ", err)
		return
	}

	if _, err := attachmentFormFile.Seek(0, io.SeekStart); err != nil {
		http.Error(w, "Cannot seek attachment file", http.StatusInternalServerError)
		log.Println("Cannot seek attachment file: ", err)
		return
	}

	if _, err := io.Copy(attachmentDestFile, io.LimitReader(attachmentFormFile, maxAttachmentSize)); err != nil {
		http.Error(w, "Cannot copy attachment file", http.StatusInternalServerError)
		log.Println("Cannot copy attachment file: ", err)
		return
	}

	attachmentURL := url.URL{
		Scheme: remoteProtocol(r),
		Host:   remoteHost(r),
		Path:   attachmentEndpointPath + attachmentID,
	}

	w.Header().Set("Location", attachmentURL.String())
	w.WriteHeader(http.StatusCreated)
}

func (a *AttachmentHandler) getAttachment(w http.ResponseWriter, r *http.Request) {
	attachmentID := strings.TrimPrefix(r.URL.Path, attachmentEndpointPath)
	if !isAttachmentID(attachmentID) {
		http.Error(w, "Attachment id is not valid", http.StatusBadRequest)
		return
	}

	root, err := os.OpenRoot(a.attachmentDirectory)
	if err != nil {
		http.Error(w, "Cannot read attachment file", http.StatusInternalServerError)
		log.Println("Cannot read attachment file: ", err)
		return
	}
	defer root.Close()

	attachmentFile, err := root.Open(attachmentID)
	if err != nil {
		http.Error(w, "Attachment not found", http.StatusNotFound)
		return
	}
	defer attachmentFile.Close() //nolint:errcheck // file opened readonly, not modified

	info, err := attachmentFile.Stat()
	if err != nil {
		http.Error(w, "Cannot read attachment file", http.StatusInternalServerError)
		log.Println("Cannot read attachment file: ", err)
		return
	}

	if len(filepath.Ext(attachmentID)) == 0 {
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Header().Set("Content-Disposition", "attachment; filename="+attachmentID)
	}

	http.ServeContent(w, r, attachmentID, info.ModTime(), attachmentFile)
}

// RegisterAttachmentAPI setup http attachment API endpoints
func RegisterAttachmentAPI() {
	attachmentHandler := &AttachmentHandler{attachmentDirectory: os.Getenv("GB2C_ATTACHMENT_DIRECTORY")}
	if len(attachmentHandler.attachmentDirectory) == 0 {
		log.Println("GB2C_ATTACHMENT_DIRECTORY is not defined, attachments will be stored in temporary directory")
		attachmentHandler.attachmentDirectory, _ = os.MkdirTemp("", "gb2c_attachments")
	}
	fmt.Println("Attachments will be stored in", attachmentHandler.attachmentDirectory)
	http.Handle(attachmentEndpointPath, attachmentHandler)
}
