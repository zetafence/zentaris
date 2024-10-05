package main

import (
	"flag"
)

type ServerConfig struct {
	org                 string // org key
	httpsPort, grpcPort int    // HTTPS, gRPC ports
	cert, key           string // TLS server cert and keys
	dbHost              string // DB host
	dbPort              int    // DB port
	dbName              string // DB name
}

const (
	DEFAULT_HTTPS_PORT    = 7778
	DEFAULT_TLS_CERT_PATH = "/etc/certs/server.crt"
	DEFAULT_TLS_KEY_PATH  = "/etc/certs/server.key"
	DEFAULT_AUTH_HEADER   = "Authorization"
)

var (
	serverCfg *ServerConfig
)

// parse command-line arguments
func parseCmdLine() {
	serverCfg = &ServerConfig{}
	flag.IntVar(&serverCfg.httpsPort, "httpsPort", DEFAULT_HTTPS_PORT, "HTTPS Port")
	flag.StringVar(&serverCfg.cert, "cert", DEFAULT_TLS_CERT_PATH, "TLS Server Certificate")
	flag.StringVar(&serverCfg.key, "key", DEFAULT_TLS_KEY_PATH, "TLS Key")
	flag.Parse()
}

// main
func main() {
	// parse command-line
	parseCmdLine()

	// REST server
	HandlerMain()
}
