GO ?= go
CGO_ENABLED ?= 0
GB2C_BINARY ?= gb2c

.PHONY: all gb2c tui test clean

all: gb2c

# Build gb2c with SQLite support, as used by gb2c.Dockerfile.
gb2c:
	CGO_ENABLED=$(CGO_ENABLED) $(GO) build -tags sqlite -o $(GB2C_BINARY) ./cmd/gb2c

tui:
	CGO_ENABLED=$(CGO_ENABLED) $(GO) build -o gb3tui ./cmd/gb3tui

test:
	$(GO) test ./...

clean:
	rm -f $(GB2C_BINARY)
