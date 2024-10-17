package scenarios

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/zetafence/zentaris/apiserver/internal/server/db"
	"github.com/zetafence/zentaris/apiserver/internal/server/graph"
)

// NewScenario returns a new graph element
func NewScenario(db db.Db) *Scenario {
	return &Scenario{
		db: db,
	}
}

func getRandomId(num int) string {
	bytes := make([]byte, num)
	if _, err := rand.Read(bytes); err != nil {
		return "none"
	}
	return fmt.Sprintf("%x", bytes)
}

// createAttackGraph creates an attack graph, stores in DB and returns id
func (s *Scenario) createAttackGraph() string {
	appData := graph.AppData{
		ID:   fmt.Sprintf("attackGraph-%v", getRandomId(8)),
		Type: "attackGraph",
	}
	appData.Name = appData.ID
	appData.Description = appData.ID
	s.db.Add(graph.DB_TABLE_GRAPH, appData.ID, appData)
	log.Printf("new attack graph app %v\n", appData.ID)
	return appData.ID
}

// createAttackGraphEntity creates an attack graph vertex, stores in DB and returns id
func (s *Scenario) createAttackGraphEntity(aid, eid string, attributes map[string]string) string {
	entity := graph.Entity{
		ID:          eid,
		Name:        eid,
		Description: eid,
		Kind:        "attackGraph-entity",
	}
	entity.Attributes = attributes

	ekey := graph.GetEntityKey(aid, entity.ID)
	entity.ID = ekey
	s.db.Add(graph.DB_TABLE_ENTITIES, ekey, entity)
	log.Printf("new attack graph entity %v\n", eid)
	return eid
}

// createUserAttackEntities creates user attack entities
func (s *Scenario) createUserAttackEntities(aid string, entity graph.Entity) error {
	attrs := map[string]string{
		"UserType": entity.Kind,
		"App":      aid,
	}
	if _, ok := entity.Attributes["MFAEnabledTime"]; !ok {
		attrs["MFAEnabled"] = "false"
		s.createAttackGraphEntity(aid, "Credential Access Access via Brute Force", attrs)
	}
	if c, ok := entity.Attributes["ConsoleAccess"]; ok {
		attrs["ConsoleAccess"] = c
		s.createAttackGraphEntity(aid, "Initial Access via Valid Accounts", attrs)
	}
	if c, ok := entity.Attributes["SSHPublicKeys"]; ok {
		attrs["SSHPublicKeys"] = c
		s.createAttackGraphEntity(aid, "Initial Access via Valid Accounts", attrs)
	}
	if c, ok := entity.Attributes["Monitored"]; ok && c == "none" {
		attrs["Monitored"] = c
		s.createAttackGraphEntity(aid, "Defense Evasion via User activities Collection", attrs)
	}
	if c, ok := entity.Attributes["PermissionsBoundary"]; ok && c == "none" {
		attrs["PermissionsBoundary"] = c
		s.createAttackGraphEntity(aid, "Persistence via Resource Hijacking", attrs)
	}
	if c, ok := entity.Attributes["AccessKeys"]; ok && c == "none" {
		attrs["AccessKeys"] = c
		s.createAttackGraphEntity(aid, "Initial Access via Valid Accounts", attrs)
	}
	return nil
}

// createPolicyAttackEntities creates user attack entities
func (s *Scenario) createPolicyAttackEntities(aid string, entity graph.Entity) error {
	attrs := map[string]string{
		"PolicyType": entity.Kind,
		"App":        aid,
	}
	if c, ok := entity.Attributes["PermissionsBoundaryUsageCount"]; ok && c == "0" {
		attrs["PermissionsBoundaryUsageCount"] = "none"
		s.createAttackGraphEntity(aid, "Credential Access: Credentials in Files due to PermissionsBoundaryUsageCount", attrs)
	}
	return nil
}

// createExfiltrationAttackEntities creates user attack entities
func (s *Scenario) createExfiltrationAttackEntities(aid string, entity graph.Entity) error {
	attrs := map[string]string{
		"ExfiltrationType": entity.Kind,
		"App":              aid,
	}
	if c, ok := entity.Attributes["OpenPorts"]; ok && strings.Contains(c, "0.0.0.0") {
		attrs["OpenPorts"] = c
		s.createAttackGraphEntity(aid, "Initial Access with External Remote Services", attrs)
	}
	if c, ok := entity.Attributes["PublicIpAddress"]; ok {
		attrs["PublicIpAddress"] = c
		s.createAttackGraphEntity(aid, "Remote System Discovery network scanning or querying public IP Address", attrs)
	}
	if c, ok := entity.Attributes["PublicDnsName"]; ok {
		attrs["PublicIpAddress"] = c
		s.createAttackGraphEntity(aid, "Remote System Discovery network scanning or querying public DNS records", attrs)
	}
	return nil
}

// createPermissiveAttackEntities creates user attack entities
func (s *Scenario) createPermissiveAttackEntities(aid string, entity graph.Entity) error {
	attrs := map[string]string{
		"PermissiveType": entity.Kind,
		"App":            aid,
	}
	if c, ok := entity.Attributes["OverlyPermissive"]; ok && c == "0" {
		attrs["OverlyPermissive"] = "none"
		s.createAttackGraphEntity(aid, "Privilege Escalation Exfiltration of Exposed Sensitive Information", attrs)
	}
	return nil
}

const APP_TYPE_ATTACK_GRAPH = "attackGraph"

// createAttackScenarios creates attack scenarios from the given graph
func (s *Scenario) createAttackScenarios(app graph.AppData) error {
	if app.Type == APP_TYPE_ATTACK_GRAPH {
		return nil
	}

	// traverse over app entities
	appId := s.createAttackGraph()
	for _, entity := range s.db.List(graph.DB_TABLE_ENTITIES) {
		e, ok := entity.(graph.Entity)
		if !ok {
			continue
		}
		if !strings.HasPrefix(e.ID, app.ID) {
			continue
		}

		// user scenarios
		if strings.Contains(e.Kind, "user") {
			s.createUserAttackEntities(appId, e)
		}

		// policy scenarios
		if strings.Contains(e.Kind, "policy") {
			s.createPolicyAttackEntities(appId, e)
		}

		// instance vuln scenarios
		if strings.Contains(e.Kind, "instance") {
			s.createExfiltrationAttackEntities(appId, e)
		}

		// s3 scenarios
		if strings.Contains(e.Kind, "s3") {
			s.createPermissiveAttackEntities(appId, e)
		}
	}
	return nil
}

// BuildScenarios builds several attack scenarios by traversing graph entities
func (s *Scenario) BuildScenarios() error {
	// collect graphs from the DB into a slice
	for _, app := range s.db.List(graph.DB_TABLE_GRAPH) {
		if a, ok := app.(graph.AppData); ok {
			// attack scenarios go here
			s.createAttackScenarios(a)
		}
	}
	return nil
}

// BuildAttackScenarios is POST handler to scan and build graph attack scenarios
func (s *Scenario) BuildAttackScenarios(w http.ResponseWriter, r *http.Request) {
	log.Printf("building attack scenarios\n")

	s.BuildScenarios()

	// Return the slice as JSON
	w.Header().Set("Content-Type", "application/json")
	buildResp := graph.Response{
		Status: "success",
	}
	json.NewEncoder(w).Encode(buildResp)
}
