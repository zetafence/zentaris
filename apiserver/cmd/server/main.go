package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/zetafence/zentaris/apiserver/internal/server/handler"
)

type ServerConfig struct {
	httpsPort, grpcPort int    // HTTPS, gRPC ports
	cert, key           string // TLS server cert and keys
}

const (
	DEFAULT_HTTPS_PORT    = 8443
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

// HandlerMain registers REST handlers
func HandlerMain() {
	r := handler.RegisterHandlers()

	// start TLS REST service
	fmt.Printf("starting HTTPS service on :%v\n", serverCfg.httpsPort)
	log.Fatal(http.ListenAndServeTLS(fmt.Sprintf(":%d", serverCfg.httpsPort),
		serverCfg.cert, serverCfg.key, r))
}

// main
func main() {
	// parse command-line
	parseCmdLine()

	// REST server
	HandlerMain()
}
