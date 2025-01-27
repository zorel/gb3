FROM docker.io/golang:1.19 AS gb2c_builder
WORKDIR /go/src/github.com/devnewton/gb3
COPY . .
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates
RUN update-ca-certificates
RUN GO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -tags sqlite ./cmd/gb2c

FROM scratch as gb2c
WORKDIR /
COPY --from=gb2c_builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=gb2c_builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=gb2c_builder /go/src/github.com/devnewton/gb3/gb2c /bin/gb2c
ENV GB2C_ATTACHMENT_DIRECTORY=/data/attachments
ENV GB2C_SQLITE_PATH=/data/posts/posts.sqlite
VOLUME /data/attachments
VOLUME /data/posts
EXPOSE 16666
CMD ["/bin/gb2c"]
