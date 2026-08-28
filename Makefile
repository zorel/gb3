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
	go fmt ./...

.PHONY: check
check:
	go vet ./...

.PHONY: build-containers
build-containers:
	$(CONTAINERCMD) build -f gb0.Dockerfile -t gb0:latest .
	$(CONTAINERCMD) build -f gb2c.Dockerfile -t gb2c:latest .
