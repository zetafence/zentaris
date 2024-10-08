package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

// Global in-memory DB instance
var kvDB = InMemoryDB{
	graph:    make(map[string]interface{}),
	entities: make(map[string]interface{}),
	assocs:   make(map[string]interface{}),
}

// CORS middleware to handle CORS preflight requests and set headers
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")                   // Allow all origins (change this to your specific origin if needed)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS") // Allowed methods
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")       // Allowed headers

		// Handle preflight request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent) // Respond with 204 No Content
			return
		}

		// Continue to the next handler
		next.ServeHTTP(w, r)
	})
}

func registerHandlers() *mux.Router {
	// Initialize router
	r := mux.NewRouter()

	// app endpoints
	r.HandleFunc("/v1/app", createAppData).Methods("POST")
	r.HandleFunc("/v1/apps", getAllApps).Methods("GET")
	r.HandleFunc("/v1/apps", getAllApps).Methods("OPTIONS")
	r.HandleFunc("/v1/app/{id}", getAppData).Methods("GET")
	r.HandleFunc("/v1/app/{id}", getAppData).Methods("OPTIONS")

	// eval
	r.HandleFunc("/v1/app/{id}/eval", evalAppData).Methods("POST")
	r.HandleFunc("/v1/app/{id}/eval", evalAppData).Methods("OPTIONS")

	// build attack scenarios
	r.HandleFunc("/v1/scenarios", buildAttackScenarios).Methods("POST")
	r.HandleFunc("/v1/scenarios", buildAttackScenarios).Methods("OPTIONS")

	// risk data
	r.HandleFunc("/v1/risk", getRiskData).Methods("GET")
	r.HandleFunc("/v1/risk", getRiskData).Methods("OPTIONS")

	// entity endpoints
	r.HandleFunc("/v1/app/{id}/entity", createEntities).Methods("POST")
	r.HandleFunc("/v1/app/{id}/entities", getAllEntities).Methods("GET")
	r.HandleFunc("/v1/app/{id}/entities", getAllEntities).Methods("OPTIONS")
	r.HandleFunc("/v1/app/{aid}/entity/{eid}", getEntityData).Methods("GET")

	// assoc endpoints
	r.HandleFunc("/v1/app/{id}/assoc", createAssocData).Methods("POST")
	r.HandleFunc("/v1/app/{id}/assocs", getAllAssocs).Methods("GET")
	r.HandleFunc("/v1/app/{id}/assocs", getAllAssocs).Methods("OPTIONS")
	r.HandleFunc("/v1/app/{aid}/assoc/{sid}", getAssocData).Methods("GET")

	// app endpoints
	r.HandleFunc("/v1/attackGraphs", getAllAttackGraphs).Methods("GET")
	r.HandleFunc("/v1/attackGraphs", getAllAttackGraphs).Methods("OPTIONS")

	// Apply CORS middleware
	r.Use(corsMiddleware)

	return r
}

func HandlerMain() {
	r := registerHandlers()

	// start TLS REST service
	fmt.Printf("starting HTTPS service on :%v\n", serverCfg.httpsPort)
	log.Fatal(http.ListenAndServeTLS(fmt.Sprintf(":%d", serverCfg.httpsPort),
		serverCfg.cert, serverCfg.key, r))
}
