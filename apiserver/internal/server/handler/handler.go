package handler

import (
	"net/http"

	"github.com/gorilla/mux"

	"github.com/zetafence/zentaris/apiserver/internal/server/db"
	"github.com/zetafence/zentaris/apiserver/internal/server/graph"
	"github.com/zetafence/zentaris/apiserver/internal/server/scenarios"
)

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

// RegisterHandlers registers all REST handlers
func RegisterHandlers() *mux.Router {
	// global in-memory DB instance
	db := db.NewMemoryDb(graph.DB_TABLE_GRAPH, graph.DB_TABLE_ENTITIES, graph.DB_TABLE_ASSOCS)

	// init router
	r := mux.NewRouter()

	// app REST endpoints
	g := graph.NewGraph(db)
	r.HandleFunc("/v1/app", g.CreateAppData).Methods("POST")
	r.HandleFunc("/v1/apps", g.GetAllApps).Methods("GET")
	r.HandleFunc("/v1/apps", g.GetAllApps).Methods("OPTIONS")
	r.HandleFunc("/v1/app/{id}", g.GetAppData).Methods("GET")
	r.HandleFunc("/v1/app/{id}", g.GetAppData).Methods("OPTIONS")

	// eval
	r.HandleFunc("/v1/app/{id}/eval", g.EvalAppData).Methods("POST")
	r.HandleFunc("/v1/app/{id}/eval", g.EvalAppData).Methods("OPTIONS")

	// build attack scenarios
	sc := scenarios.NewScenario(db)
	r.HandleFunc("/v1/scenarios", sc.BuildAttackScenarios).Methods("POST")
	r.HandleFunc("/v1/scenarios", sc.BuildAttackScenarios).Methods("OPTIONS")

	// risk data
	r.HandleFunc("/v1/risk", g.GetRiskData).Methods("GET")
	r.HandleFunc("/v1/risk", g.GetRiskData).Methods("OPTIONS")

	// entity endpoints
	r.HandleFunc("/v1/app/{id}/entity", g.CreateEntities).Methods("POST")
	r.HandleFunc("/v1/app/{id}/entities", g.GetAllEntities).Methods("GET")
	r.HandleFunc("/v1/app/{id}/entities", g.GetAllEntities).Methods("OPTIONS")
	r.HandleFunc("/v1/app/{aid}/entity/{eid}", g.GetEntityData).Methods("GET")

	// assoc endpoints
	r.HandleFunc("/v1/app/{id}/assoc", g.CreateAssocData).Methods("POST")
	r.HandleFunc("/v1/app/{id}/assocs", g.GetAllAssocs).Methods("GET")
	r.HandleFunc("/v1/app/{id}/assocs", g.GetAllAssocs).Methods("OPTIONS")
	r.HandleFunc("/v1/app/{aid}/assoc/{sid}", g.GetAssocData).Methods("GET")

	// app endpoints
	r.HandleFunc("/v1/attackGraphs", g.GetAllAttackGraphs).Methods("GET")
	r.HandleFunc("/v1/attackGraphs", g.GetAllAttackGraphs).Methods("OPTIONS")

	// Apply CORS middleware
	r.Use(corsMiddleware)

	return r
}
