package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

// POST handler to accept JSON input and store it in the key-value store
func createAppData(w http.ResponseWriter, r *http.Request) {
	var appData AppData
	err := json.NewDecoder(r.Body).Decode(&appData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Lock for writing to the in-memory DB
	kvDB.mu.Lock()
	defer kvDB.mu.Unlock()
	kvDB.graph[appData.ID] = appData
	log.Printf("new app %v\n", appData.ID)

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "Data with ID %s created", appData.ID)
}

// GET handler to fetch JSON by ID from the key-value store
func getAppData(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	// Lock for reading from the in-memory DB
	kvDB.mu.RLock()
	appData, exists := kvDB.graph[id]
	kvDB.mu.RUnlock()

	if !exists {
		http.Error(w, "Data not found", http.StatusNotFound)
		return
	}

	// Return the JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(appData)
}

// Handler to retrieve a list of all entities (GET request)
func getAllApps(w http.ResponseWriter, r *http.Request) {
	// Lock the map to ensure thread-safe access
	kvDB.mu.RLock()
	defer kvDB.mu.RUnlock()

	// Collect all assocs from the kvDB into a slice (array)
	appList := AppsList{
		Apps: []AppData{},
	}
	for _, app := range kvDB.graph {
		if a, ok := app.(AppData); ok {
			if a.Type != "attackGraph" {
				appList.Apps = append(appList.Apps, a)
			}
		}
	}

	// Return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(appList)
}

// POST handler to accept JSON input and store it in the key-value store
func evalAppData(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	log.Printf("evaluating app %v\n", id)

	// Return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	evalResp := Response{
		Status: fmt.Sprintf("success for %v", id),
	}
	json.NewEncoder(w).Encode(evalResp)
}

// POST handler to accept JSON input and store it in the key-value store
func buildAttackScenarios(w http.ResponseWriter, r *http.Request) {
	log.Printf("building attack scenarios\n")

	BuildScenarios()

	// Return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	buildResp := Response{
		Status: "success",
	}
	json.NewEncoder(w).Encode(buildResp)
}

// POST handler to accept JSON input and store it in the key-value store
func getRiskData(w http.ResponseWriter, r *http.Request) {
	// Return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	resp := RiskResponse{Response: `{"mitreAttackReport":{"findings":[{"severityLevel":"HIGH","mitreAttackTactics":["Persistence"],"riskCategories":["Low"],"description":"User user-john permission boundary restrictions is not set. If a user's permission boundary restrictions are not set, it involves a higher risk of privilege escalation and unauthorized access to resources due to the absence of constraints on the user's permissions.","affected":["aws-ec2-spot-fleet-tagging-role","AWSServiceRoleForOrganizations","AWSServiceRoleForSupport","AWSServiceRoleForTrustedAdvisor","john-test-ec2-role"],"remediationRecommendations":["Set proper permission boundary restrictions for user user-john to prevent unauthorized access and privilege escalation."]},{"severityLevel":"HIGH","mitreAttackTactics":["Persistence"],"riskCategories":["High"],"description":"User user-john does not belong to any group. User not belonging to any IAM group in AWS is considered high severity, as it increases the risk of inconsistent access controls, potential misconfigurations, and difficulties in managing user permissions effectively.","affected":["aws-ec2-spot-fleet-tagging-role","AWSServiceRoleForOrganizations","AWSServiceRoleForSupport","AWSServiceRoleForTrustedAdvisor","john-test-ec2-role"],"remediationRecommendations":["Assign user user-john to an appropriate IAM group to enforce consistent access controls and improve permission management."]},{"severityLevel":"CRITICAL","mitreAttackTactics":["Defense Evasion"],"riskCategories":["High"],"description":"User user-john activities not monitored. If user activities are not monitored, such as CloudTrail not being enabled in AWS, is characterized by a high severity level due to the heightened risk of undetected malicious activity, unauthorized access, and potential data breaches.","affected":["aws-ec2-spot-fleet-tagging-role","AWSServiceRoleForOrganizations","AWSServiceRoleForSupport","AWSServiceRoleForTrustedAdvisor","john-test-ec2-role"],"remediationRecommendations":["Enable CloudTrail monitoring for user user-john to enhance visibility into security events and detect potential malicious activities."]},{"severityLevel":"CRITICAL","mitreAttackTactics":["Credential Access"],"riskCategories":["Critical"],"description":"User user-john MFA is not enabled. Attackers may attempt to compromise the account user-john through methods like phishing, password guessing, or exploiting weak credentials. This could lead to unauthorized access, data breaches, and potential exploitation of AWS resources.","affected":["AWSServiceRoleForSupport","AWSServiceRoleForTrustedAdvisor","john-test-ec2-role","aws-ec2-spot-fleet-tagging-role","AWSServiceRoleForOrganizations"],"remediationRecommendations":["Enable Multi-Factor Authentication (MFA) for user user-john to prevent unauthorized access through brute force attacks and enhance the security of the account."]}]}}`}
	json.NewEncoder(w).Encode(resp)
}

func getEntityKey(aid, eid string) string {
	return fmt.Sprintf("%s/%s", aid, eid)
}

// POST handler to accept JSON input and store it in the key-value store
func createEntities(w http.ResponseWriter, r *http.Request) {
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

	// Lock for writing to the in-memory DB
	kvDB.mu.Lock()
	defer kvDB.mu.Unlock()
	for _, entity := range newEntities.Entities {
		ekey := getEntityKey(aid, entity.ID)
		entity.ID = ekey
		kvDB.entities[ekey] = entity
		log.Printf("new app entity %v\n", ekey)
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "entities for app %s created", aid)
}

// Handler to retrieve a list of all entities (GET request)
func getAllEntities(w http.ResponseWriter, r *http.Request) {
	// Lock the map to ensure thread-safe access
	kvDB.mu.RLock()
	defer kvDB.mu.RUnlock()

	vars := mux.Vars(r)
	aid := vars["id"]

	// Collect all entities from the kvDB into a slice (array)
	entList := EntityList{
		Entities: []Entity{},
	}
	for _, entity := range kvDB.entities {
		if e, ok := entity.(Entity); ok {
			if strings.HasPrefix(e.ID, aid) {
				parts := strings.Split(e.ID, "/")
				e.ID = parts[len(parts)-1]
				entList.Entities = append(entList.Entities, e)
			}
		}
	}

	// Return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entList)
}

// GET handler to fetch JSON by ID from the key-value store
func getEntityData(w http.ResponseWriter, r *http.Request) {
	var (
		vars = mux.Vars(r)
		eid  = vars["eid"]
	)

	// Lock for reading from the in-memory DB
	kvDB.mu.RLock()
	entity, exists := kvDB.entities[eid]
	kvDB.mu.RUnlock()

	if !exists {
		http.Error(w, "Data not found", http.StatusNotFound)
		return
	}

	// Return the JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entity)
}

// POST handler to accept JSON input and store it in the key-value store
func createAssocData(w http.ResponseWriter, r *http.Request) {
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

	// Lock for writing to the in-memory DB
	kvDB.mu.Lock()
	defer kvDB.mu.Unlock()
	for _, assoc := range assocList.Assocs {
		skey := getAssocKey(aid, assoc.ID)
		assoc.ID = skey
		kvDB.assocs[assoc.ID] = assoc
		log.Printf("new app assoc %v\n", skey)
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintf(w, "assocs for app %s created", aid)
}

// GET handler to fetch JSON by ID from the key-value store
func getAssocData(w http.ResponseWriter, r *http.Request) {
	var (
		vars = mux.Vars(r)
		sid  = vars["sid"]
	)

	// Lock for reading from the in-memory DB
	kvDB.mu.RLock()
	assoc, exists := kvDB.assocs[sid]
	kvDB.mu.RUnlock()

	if !exists {
		http.Error(w, "Data not found", http.StatusNotFound)
		return
	}

	// Return the JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assoc)
}

// Handler to retrieve a list of all entities (GET request)
func getAllAssocs(w http.ResponseWriter, r *http.Request) {
	// Lock the map to ensure thread-safe access
	kvDB.mu.RLock()
	defer kvDB.mu.RUnlock()

	vars := mux.Vars(r)
	aid := vars["id"]

	// Collect all assocs from the kvDB into a slice (array)
	assocList := AssocList{
		Assocs: []Assoc{},
	}
	for _, assoc := range kvDB.assocs {
		if a, ok := assoc.(Assoc); ok {
			if strings.HasPrefix(a.ID, aid) {
				parts := strings.Split(a.ID, "/")
				a.ID = parts[len(parts)-1]
				assocList.Assocs = append(assocList.Assocs, a)
			}
		}
	}

	// Return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assocList)
}

// Handler to retrieve a list of all attack graphs
func getAllAttackGraphs(w http.ResponseWriter, r *http.Request) {
	// Lock the map to ensure thread-safe access
	kvDB.mu.RLock()
	defer kvDB.mu.RUnlock()

	// Collect all assocs from the kvDB into a slice (array)
	appList := AppsList{
		Apps: []AppData{},
	}
	for _, app := range kvDB.graph {
		if a, ok := app.(AppData); ok {
			if a.Type == "attackGraph" {
				appList.Apps = append(appList.Apps, a)
			}
		}
	}

	// Return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(appList)
}
