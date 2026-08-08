FROM docker.io/golang:1.24 AS gb0_builder
WORKDIR /go/src/codeberg.org/devnewton/gb3
# Only download updates if modules files have changed
COPY go.mod go.sum .
RUN go mod download
COPY . .
RUN GOOS=linux CGO_ENABLED=0 go build ./cmd/gb0

FROM scratch as gb0
WORKDIR /
COPY --from=gb0_builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=gb0_builder /go/src/codeberg.org/devnewton/gb3/gb0 /bin/gb0
ENV GB0_STORE_DIRECTORY=/data
VOLUME /data
EXPOSE 16667
CMD ["/bin/gb0"]
