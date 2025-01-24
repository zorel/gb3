FROM docker.io/golang:1.19 AS gb0_builder
WORKDIR /go/src/github.com/devnewton/gb3
COPY . .
RUN mkdir /tempdir
RUN GOOS=linux CGO_ENABLED=0 go build ./cmd/gb0

FROM scratch as gb0
WORKDIR /
COPY --from=gb0_builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=gb2c_builder /tempdir /tmp
COPY --from=gb0_builder /go/src/github.com/devnewton/gb3/gb0 /bin/gb0
EXPOSE 16667
CMD ["/bin/gb0"]
