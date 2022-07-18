#!/bin/sh
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build ./cmd/gb0
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build ./cmd/gb2c
#upx --lzma --best gb0
#upx --lzma --best gb2c
tar czf gc2.tar.gz --exclude=gc2/node_modules --exclude=gc2/.jshintignore --exclude=gc2/.jshintrc --exclude=gc2/package.json gc2
