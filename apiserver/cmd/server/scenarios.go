package main

import (
	"crypto/rand"
	"fmt"
	"log"
	"strings"
)

func getRandomId(num int) string {
	bytes := make([]byte, num)
	if _, err := rand.Read(bytes); err != nil {
		return "none"
	}
	return fmt.Sprintf("%x", bytes)
}

// creates an attack graph, stores in DB and returns id
func createAttackGraph() string {
	appData := AppData{
		ID:   fmt.Sprintf("attackGraph-%v", getRandomId(8)),
		Type: "attackGraph",
	}
	appData.Name = appData.ID
	appData.Description = appData.ID
	kvDB.graph[appData.ID] = appData
	log.Printf("new attack graph app %v\n", appData.ID)
	return appData.ID
}

// creates an attack graph entities, stores in DB and returns id
func createAttackGraphEntity(aid, eid string, attributes map[string]string) string {
	entity := Entity{
		ID:          eid,
		Name:        eid,
		Description: eid,
		Kind:        "attackGraph-entity",
	}
	entity.Attributes = attributes

	ekey := getEntityKey(aid, entity.ID)
	entity.ID = ekey
	kvDB.entities[ekey] = entity
	log.Printf("new attack graph entity %v\n", eid)
	return eid
}

// createUserAttackEntities creates user attack entities
func createUserAttackEntities(aid string, entity Entity) error {
	attrs := map[string]string{
		"UserType": entity.Kind,
		"App":      aid,
	}
	if _, ok := entity.Attributes["MFAEnabledTime"]; !ok {
		attrs["MFAEnabled"] = "false"
		createAttackGraphEntity(aid, "Credential Access Access via Brute Force", attrs)
	}
	if c, ok := entity.Attributes["ConsoleAccess"]; ok {
		attrs["ConsoleAccess"] = c
		createAttackGraphEntity(aid, "Initial Access via Valid Accounts", attrs)
	}
	if c, ok := entity.Attributes["SSHPublicKeys"]; ok {
		attrs["SSHPublicKeys"] = c
		createAttackGraphEntity(aid, "Initial Access via Valid Accounts", attrs)
	}
	if c, ok := entity.Attributes["Monitored"]; ok && c == "none" {
		attrs["Monitored"] = c
		createAttackGraphEntity(aid, "Defense Evasion via User activities Collection", attrs)
	}
	if c, ok := entity.Attributes["PermissionsBoundary"]; ok && c == "none" {
		attrs["PermissionsBoundary"] = c
		createAttackGraphEntity(aid, "Persistence via Resource Hijacking", attrs)
	}
	if c, ok := entity.Attributes["AccessKeys"]; ok && c == "none" {
		attrs["AccessKeys"] = c
		createAttackGraphEntity(aid, "Initial Access via Valid Accounts", attrs)
	}
	return nil
}

// createPolicyAttackEntities creates user attack entities
func createPolicyAttackEntities(aid string, entity Entity) error {
	attrs := map[string]string{
		"PolicyType": entity.Kind,
		"App":        aid,
	}
	if c, ok := entity.Attributes["PermissionsBoundaryUsageCount"]; ok && c == "0" {
		attrs["PermissionsBoundaryUsageCount"] = "none"
		createAttackGraphEntity(aid, "Credential Access: Credentials in Files due to PermissionsBoundaryUsageCount", attrs)
	}
	return nil
}

// createExfiltrationAttackEntities creates user attack entities
func createExfiltrationAttackEntities(aid string, entity Entity) error {
	attrs := map[string]string{
		"ExfiltrationType": entity.Kind,
		"App":              aid,
	}
	if c, ok := entity.Attributes["OpenPorts"]; ok && strings.Contains(c, "0.0.0.0") {
		attrs["OpenPorts"] = c
		createAttackGraphEntity(aid, "Initial Access with External Remote Services", attrs)
	}
	if c, ok := entity.Attributes["PublicIpAddress"]; ok {
		attrs["PublicIpAddress"] = c
		createAttackGraphEntity(aid, "Remote System Discovery network scanning or querying public IP Address", attrs)
	}
	if c, ok := entity.Attributes["PublicDnsName"]; ok {
		attrs["PublicIpAddress"] = c
		createAttackGraphEntity(aid, "Remote System Discovery network scanning or querying public DNS records", attrs)
	}
	return nil
}

// createPermissiveAttackEntities creates user attack entities
func createPermissiveAttackEntities(aid string, entity Entity) error {
	attrs := map[string]string{
		"PermissiveType": entity.Kind,
		"App":            aid,
	}
	if c, ok := entity.Attributes["OverlyPermissive"]; ok && c == "0" {
		attrs["OverlyPermissive"] = "none"
		createAttackGraphEntity(aid, "Privilege Escalation Exfiltration of Exposed Sensitive Information", attrs)
	}
	return nil
}

func createAttackScenarios(app AppData) error {
	if app.Type == "attackGraph" {
		return nil
	}

	// traverse over app entities
	appId := createAttackGraph()
	for _, entity := range kvDB.entities {
		e, ok := entity.(Entity)
		if !ok {
			continue
		}
		if !strings.HasPrefix(e.ID, app.ID) {
			continue
		}

		// user scenarios
		if strings.Contains(e.Kind, "user") {
			createUserAttackEntities(appId, e)
		}

		// policy scenarios
		if strings.Contains(e.Kind, "policy") {
			createPolicyAttackEntities(appId, e)
		}

		// instance vuln scenarios
		if strings.Contains(e.Kind, "instance") {
			createExfiltrationAttackEntities(appId, e)
		}

		// s3 scenarios
		if strings.Contains(e.Kind, "s3") {
			createPermissiveAttackEntities(appId, e)
		}
	}
	return nil
}

// POST handler to accept JSON input and store it in the key-value store
func BuildScenarios() error {
	// Lock the map to ensure thread-safe access
	kvDB.mu.Lock()
	defer kvDB.mu.Unlock()

	// Collect all assocs from the kvDB into a slice (array)
	for _, app := range kvDB.graph {
		if a, ok := app.(AppData); ok {
			// attack scenarios go here
			createAttackScenarios(a)
		}
	}
	return nil
}
