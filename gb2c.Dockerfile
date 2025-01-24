FROM docker.io/golang:1.19 AS gb2c_builder
WORKDIR /go/src/github.com/devnewton/gb3
COPY . .
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates
RUN update-ca-certificates
RUN mkdir /tempdir
RUN GOOS=linux CGO_ENABLED=0 go build ./cmd/gb2c

FROM scratch as gb2c
WORKDIR /
COPY --from=gb2c_builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=gb2c_builder /tempdir /tmp
COPY --from=gb2c_builder /go/src/github.com/devnewton/gb3/gb2c /bin/gb2c
EXPOSE 16666
CMD ["/bin/gb2c"]
