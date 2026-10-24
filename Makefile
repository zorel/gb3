GO ?= go
CGO_ENABLED ?= 0
GOLANGCI_LINT=github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.13.2
GOVULNCHECK=golang.org/x/vuln/cmd/govulncheck@v1.5.0

ifneq "" "$(shell command -v podman)"
CONTAINERCMD=podman
else
CONTAINERCMD=docker
endif

.PHONY: all gb2c tui test
all: gb2c

# Build gb2c with SQLite support, as used by gb2c.Dockerfile.
gb2c:
	CGO_ENABLED=$(CGO_ENABLED) $(GO) build -tags sqlite -o gb2c ./cmd/gb2c

tui:
	CGO_ENABLED=$(CGO_ENABLED) $(GO) build -o gb3tui ./cmd/gb3tui

test:
	$(GO) test ./...

.PHONY: clean
clean:
	rm -f gb0 gb2c cachetotoz gb3tui

.PHONY: fmt fmt-go fmt-js
fmt-go:
	go run $(GOLANGCI_LINT) fmt

fmt-js:
	cd gc2 && npm run fmt

fmt: fmt-go fmt-js

.PHONY: check check-go check-js
check-go:
	go run $(GOLANGCI_LINT) run
	go run $(GOVULNCHECK) -show verbose ./...

check-js:
	cd gc2 && npm run lint
	cd gc2 && npm test

check: check-go check-js

.PHONY: build-containers
build-containers:
	$(CONTAINERCMD) build -f gb0.Dockerfile -t gb0:latest .
	$(CONTAINERCMD) build -f gb2c.Dockerfile -t gb2c:latest .
