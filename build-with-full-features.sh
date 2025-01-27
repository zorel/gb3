#!/bin/sh
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build ./cmd/gb0
GO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -tags sqlite ./cmd/gb2c
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build ./cmd/cachetotoz
tar czf gc2.tar.gz --exclude=gc2/node_modules --exclude=gc2/.jshintignore --exclude=gc2/.jshintrc --exclude=gc2/package.json gc2
