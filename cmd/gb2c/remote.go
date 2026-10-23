package main

import (
	"net/http"
	"time"
)

func newHttpClient() *http.Client {
	transport := &http.Transport{
		Proxy:               http.ProxyFromEnvironment,
		MaxIdleConns:        64,
		MaxIdleConnsPerHost: 8,
		IdleConnTimeout:     90 * time.Second,
	}
	return &http.Client{
		Transport: transport,
		// Do not let a stuck tribune block its poll loop forever.
		Timeout: 30 * time.Second,
	}
}

func remoteHost(r *http.Request) string {
	host := r.Header.Get("X-Forwarded-Host")
	if len(host) == 0 {
		host = r.Host
	}
	return host
}

func remoteProtocol(r *http.Request) string {
	protocol := r.Header.Get("X-Forwarded-Proto")
	if len(protocol) == 0 {
		protocol = "http"
	}
	return protocol
}
