#!/bin/sh
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o . ./...
tar czf gc2.tar.gz \
  --exclude=gc2/node_modules \
  --exclude=gc2/eslint-config.mjs \
  --exclude=gc2/package.json \
  --exclude=gc2/package-lock.json \
  gc2
