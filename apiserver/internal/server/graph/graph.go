package graph

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"

	"github.com/zetafence/zentaris/apiserver/internal/server/db"
)

const (
	// DB tables to represent graph
	DB_TABLE_GRAPH    = "graph"
	DB_TABLE_ENTITIES = "entities"
	DB_TABLE_ASSOCS   = "assocs"
)

// NewGraph returns a new graph element
func NewGraph(db db.Db) *Graph {
	return &Graph{
		db: db,
	}
}

// CreateAppData is POST handler to accept JSON input and store it in the key-value store
func (g *Graph) CreateAppData(w http.ResponseWriter, r *http.Request) {
	var appData AppData
	err := json.NewDecoder(r.Body).Decode(&appData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	g.db.Add(DB_TABLE_GRAPH, appData.ID, appData)
	log.Printf("new app %v\n", appData.ID)

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "Data with ID %s created", appData.ID)
}

// GetAppData is GET handler to fetch JSON by ID from the key-value store
func (g *Graph) GetAppData(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	appData, err := g.db.Get(DB_TABLE_GRAPH, id)
	if err != nil {
		http.Error(w, "Data not found", http.StatusNotFound)
		return
	}

	// return JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(appData)
}

// GetAllApps is GET Handler to retrieve a list of all entities
func (g *Graph) GetAllApps(w http.ResponseWriter, r *http.Request) {
	// collect all assocs from the DB into a slice (array)
	appList := AppsList{
		Apps: []AppData{},
	}
	for _, app := range g.db.List(DB_TABLE_GRAPH) {
		if a, ok := app.(AppData); ok {
			if a.Type != "attackGraph" {
				appList.Apps = append(appList.Apps, a)
			}
		}
	}

	// return slice as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(appList)
}

// EvalAppData is POST eval handler to accept JSON input and store it in the key-value store
func (g *Graph) EvalAppData(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	log.Printf("evaluating app %v\n", id)

	// return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	evalResp := Response{
		Status: fmt.Sprintf("success for %v", id),
	}
	json.NewEncoder(w).Encode(evalResp)
}

// GetRiskData is POST risk handler to accept JSON input and store it in the key-value store
func (g *Graph) GetRiskData(w http.ResponseWriter, r *http.Request) {
	// Return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	resp := RiskResponse{Response: `{"mitreAttackReport":{"findings":[{"severityLevel":"HIGH","mitreAttackTactics":["Persistence"],"riskCategories":["Low"],"description":"User user-john permission boundary restrictions is not set. If a user's permission boundary restrictions are not set, it involves a higher risk of privilege escalation and unauthorized access to resources due to the absence of constraints on the user's permissions.","affected":["aws-ec2-spot-fleet-tagging-role","AWSServiceRoleForOrganizations","AWSServiceRoleForSupport","AWSServiceRoleForTrustedAdvisor","john-test-ec2-role"],"remediationRecommendations":["Set proper permission boundary restrictions for user user-john to prevent unauthorized access and privilege escalation."]},{"severityLevel":"HIGH","mitreAttackTactics":["Persistence"],"riskCategories":["High"],"description":"User user-john does not belong to any group. User not belonging to any IAM group in AWS is considered high severity, as it increases the risk of inconsistent access controls, potential misconfigurations, and difficulties in managing user permissions effectively.","affected":["aws-ec2-spot-fleet-tagging-role","AWSServiceRoleForOrganizations","AWSServiceRoleForSupport","AWSServiceRoleForTrustedAdvisor","john-test-ec2-role"],"remediationRecommendations":["Assign user user-john to an appropriate IAM group to enforce consistent access controls and improve permission management."]},{"severityLevel":"CRITICAL","mitreAttackTactics":["Defense Evasion"],"riskCategories":["High"],"description":"User user-john activities not monitored. If user activities are not monitored, such as CloudTrail not being enabled in AWS, is characterized by a high severity level due to the heightened risk of undetected malicious activity, unauthorized access, and potential data breaches.","affected":["aws-ec2-spot-fleet-tagging-role","AWSServiceRoleForOrganizations","AWSServiceRoleForSupport","AWSServiceRoleForTrustedAdvisor","john-test-ec2-role"],"remediationRecommendations":["Enable CloudTrail monitoring for user user-john to enhance visibility into security events and detect potential malicious activities."]},{"severityLevel":"CRITICAL","mitreAttackTactics":["Credential Access"],"riskCategories":["Critical"],"description":"User user-john MFA is not enabled. Attackers may attempt to compromise the account user-john through methods like phishing, password guessing, or exploiting weak credentials. This could lead to unauthorized access, data breaches, and potential exploitation of AWS resources.","affected":["AWSServiceRoleForSupport","AWSServiceRoleForTrustedAdvisor","john-test-ec2-role","aws-ec2-spot-fleet-tagging-role","AWSServiceRoleForOrganizations"],"remediationRecommendations":["Enable Multi-Factor Authentication (MFA) for user user-john to prevent unauthorized access through brute force attacks and enhance the security of the account."]}]}}`}
	json.NewEncoder(w).Encode(resp)
}

func GetEntityKey(aid, eid string) string {
	return fmt.Sprintf("%s/%s", aid, eid)
}

// CreateEntities is POST handler to accept JSON input and store it in the key-value store
func (g *Graph) CreateEntities(w http.ResponseWriter, r *http.Request) {
	var (
		newEntities EntityList
		vars        = mux.Vars(r)
		aid         = vars["id"]
	)

	err := json.NewDecoder(r.Body).Decode(&newEntities)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, entity := range newEntities.Entities {
		ekey := GetEntityKey(aid, entity.ID)
		entity.ID = ekey
		g.db.Add(DB_TABLE_ENTITIES, ekey, entity)
		log.Printf("new app entity %v\n", ekey)
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "entities for app %s created", aid)
}

// GetAllEntities is GET handler to retrieve a list of all entities
func (g *Graph) GetAllEntities(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	aid := vars["id"]

	// collect entities from the DB into a slice
	entList := EntityList{
		Entities: []Entity{},
	}
	for _, entity := range g.db.List(DB_TABLE_ENTITIES) {
		if e, ok := entity.(Entity); ok {
			if strings.HasPrefix(e.ID, aid) {
				parts := strings.Split(e.ID, "/")
				e.ID = parts[len(parts)-1]
				entList.Entities = append(entList.Entities, e)
			}
		}
	}

	// return slice as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entList)
}

// GetEntityData is GET handler to fetch JSON by ID from the key-value store
func (g *Graph) GetEntityData(w http.ResponseWriter, r *http.Request) {
	var (
		vars = mux.Vars(r)
		eid  = vars["eid"]
	)

	entity, err := g.db.Get(DB_TABLE_ENTITIES, eid)
	if err != nil {
		http.Error(w, "Data not found", http.StatusNotFound)
		return
	}

	// return JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entity)
}

// CreateAssocData is POST handler to accept JSON input and store it in the key-value store
func (g *Graph) CreateAssocData(w http.ResponseWriter, r *http.Request) {
	var (
		assocList AssocList
		vars      = mux.Vars(r)
		aid       = vars["id"]
	)

	err := json.NewDecoder(r.Body).Decode(&assocList)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	getAssocKey := func(aid, sid string) string {
		return fmt.Sprintf("%s/%s", aid, sid)
	}

	for _, assoc := range assocList.Assocs {
		skey := getAssocKey(aid, assoc.ID)
		assoc.ID = skey
		g.db.Add(DB_TABLE_ASSOCS, assoc.ID, assoc)
		log.Printf("new app assoc %v\n", skey)
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "assocs for app %s created", aid)
}

// GetAssocData is GET handler to fetch JSON by ID from the key-value store
func (g *Graph) GetAssocData(w http.ResponseWriter, r *http.Request) {
	var (
		vars = mux.Vars(r)
		sid  = vars["sid"]
	)

	assoc, err := g.db.Get(DB_TABLE_ASSOCS, sid)
	if err != nil {
		http.Error(w, "Data not found", http.StatusNotFound)
		return
	}

	// return JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assoc)
}

// GetAllAssocs is GET Handler to retrieve a list of all entities
func (g *Graph) GetAllAssocs(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	aid := vars["id"]

	// collect assocs from the DB into a slice
	assocList := AssocList{
		Assocs: []Assoc{},
	}
	for _, assoc := range g.db.List(DB_TABLE_ASSOCS) {
		if a, ok := assoc.(Assoc); ok {
			if strings.HasPrefix(a.ID, aid) {
				parts := strings.Split(a.ID, "/")
				a.ID = parts[len(parts)-1]
				assocList.Assocs = append(assocList.Assocs, a)
			}
		}
	}

	// return slice as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assocList)
}

// GetAllAttackGraphs is GET Handler to retrieve a list of all attack graphs
func (g *Graph) GetAllAttackGraphs(w http.ResponseWriter, r *http.Request) {
	// collect all assocs from the DB into a slice (array)
	appList := AppsList{
		Apps: []AppData{},
	}
	for _, app := range g.db.List(DB_TABLE_GRAPH) {
		if a, ok := app.(AppData); ok {
			if a.Type == "attackGraph" {
				appList.Apps = append(appList.Apps, a)
			}
		}
	}

	// return slice as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(appList)
}
