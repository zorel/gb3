GOLANGCI_LINT=github.com/golangci/golangci-lint/v2/cmd/golangci-lint@v2.13.2

ifneq "" "$(shell command -v podman)"
CONTAINERCMD=podman
else
CONTAINERCMD=docker
endif

.PHONY: all
all:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -tags sqlite -o . ./...

.PHONY: clean
clean:
	rm -f gb0 gb2c cachetotoz

.PHONY: fmt
fmt:
	go run $(GOLANGCI_LINT) fmt

.PHONY: check
check:
	go run $(GOLANGCI_LINT) run

.PHONY: build-containers
build-containers:
	$(CONTAINERCMD) build -f gb0.Dockerfile -t gb0:latest .
	$(CONTAINERCMD) build -f gb2c.Dockerfile -t gb2c:latest .
