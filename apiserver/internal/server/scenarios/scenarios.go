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

const (
	NONE_STR = ""
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

// createUserBruteForce creates user brute force attack entities
func (s *Scenario) createUserBruteForce(aid string, entity graph.Entity) error {
	attrs := map[string]string{
		"UserBruteForceType": entity.Kind,
		"App":                aid,
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

// createPolicyCompromise creates policy compromise attack scenarios
func (s *Scenario) createPolicyCompromise(aid string, entity graph.Entity) error {
	attrs := map[string]string{
		"PolicyCompromiseType": entity.Kind,
		"App":                  aid,
	}
	if c, ok := entity.Attributes["PermissionsBoundaryUsageCount"]; ok && c == "0" {
		attrs["PermissionsBoundaryUsageCount"] = "none"
		attrs["Risk"] = "high"
		s.createAttackGraphEntity(aid, "Credential Compromise and Lateral Movement due to PermissionsBoundaryUsageCount", attrs)
	}
	return nil
}

// createUnauthorizedAccess( creates attack entities for unauthorized access
func (s *Scenario) createUnauthorizedAccess(aid string, entity graph.Entity) error {
	attrs := map[string]string{
		"UnauthorizedAccessType": entity.Kind,
		"App":                    aid,
	}
	c, ok := entity.Attributes["PermissionsBoundary"]
	if !ok || c == NONE_STR {
		attrs["PermissionsBoundary"] = c
		attrs["Risk"] = "critical"
		s.createAttackGraphEntity(aid, "Credential Compromise and Lateral Movement due to PermissionsBoundary being not set", attrs)
	}
	c, ok = entity.Attributes["MaxSessionDuration"]
	if !ok || c == NONE_STR {
		attrs["MaxSessionDuration"] = c
		attrs["Risk"] = "high"
		s.createAttackGraphEntity(aid, "Credential Compromise and Lateral Movement due to MaxSessionDuration is not set", attrs)
	}
	return nil
}

// createPubliclyAccessibleResources creates attack entities for public accessible
func (s *Scenario) createPubliclyAccessibleResources(aid string, entity graph.Entity) error {
	attrs := map[string]string{
		"PubliclyAccessibleType": entity.Kind,
		"App":                    aid,
	}
	if c, ok := entity.Attributes["OpenPorts"]; ok && strings.Contains(c, "0.0.0.0") {
		attrs["OpenPorts"] = c
		attrs["Risk"] = "high"
		s.createAttackGraphEntity(aid, "Initial Access with External Remote Services", attrs)
	}
	if c, ok := entity.Attributes["PublicIpAddress"]; ok {
		attrs["PublicIpAddress"] = c
		attrs["Risk"] = "medium"
		s.createAttackGraphEntity(aid, "Remote System Discovery network scanning or querying public IP Address", attrs)
	}
	if c, ok := entity.Attributes["PublicDnsName"]; ok {
		attrs["PublicIpAddress"] = c
		attrs["Risk"] = "medium"
		s.createAttackGraphEntity(aid, "Remote System Discovery network scanning or querying public DNS records", attrs)
	}
	return nil
}

// createExfiltration creates attack entities for data exfiltration
func (s *Scenario) createExfiltration(aid string, entity graph.Entity) error {
	attrs := map[string]string{
		"ExFiltrationType": entity.Kind,
		"App":              aid,
	}
	if c, ok := entity.Attributes["OverlyPermissive"]; ok && c == "0" {
		attrs["OverlyPermissive"] = "none"
		attrs["Risk"] = "critical"
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

		// filter out entities other than this app
		if !strings.HasPrefix(e.ID, app.ID) {
			continue
		}

		// brute force scenarios
		if strings.Contains(e.Kind, "user") {
			s.createUserBruteForce(appId, e)
		}

		// policy compromise scenarios
		if strings.Contains(e.Kind, "policy") {
			s.createPolicyCompromise(appId, e)
		}

		// unauthorized access scenarios
		if strings.Contains(e.Kind, "role") {
			s.createUnauthorizedAccess(appId, e)
		}

		// publicly accessible resources
		if strings.Contains(e.Kind, "instance") {
			s.createPubliclyAccessibleResources(appId, e)
		}

		// s3 scenarios
		if strings.Contains(e.Kind, "s3") {
			s.createExfiltration(appId, e)
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
