package main

// Data structure for JSON
type AppData struct {
	ID               string                 `json:"id"`
	Name             string                 `json:"name"`
	Type             string                 `json:"type"`
	Description      string                 `json:"description"`
	Fitness          int                    `json:"fitness"`
	Propensity       int                    `json:"propensity"`
	Stats            Stats                  `json:"stats"`
	Attributes       map[string]interface{} `json:"attributes"`
	Created          string                 `json:"created"`
	LastModified     string                 `json:"lastModified"`
	LastModifiedUser string                 `json:"lastModifiedUser"`
}

type Stats struct {
	NumRuns    int   `json:"numruns"`
	NumQueries int   `json:"numqueries"`
	NumResp    int   `json:"numresp"`
	RunTS      []int `json:"runts"`
}

// list of apps
type AppsList struct {
	Apps []AppData `json:"apps"`
}

// graph entities
type Entity struct {
	ID               string            `json:"id"`
	Name             string            `json:"name"`
	Description      string            `json:"description"`
	Kind             string            `json:"kind"`
	Attributes       map[string]string `json:"attributes"`
	Entities         []Entity          `json:"entities"`
	Fitness          int               `json:"fitness"`
	Actions          Action            `json:"actions"`
	Stats            interface{}       `json:"stats"` // Assuming stats can be of various types, use `interface{}` or define a specific type
	Created          string            `json:"created"`
	LastModified     string            `json:"lastModified"`
	LastModifiedUser string            `json:"lastModifiedUser"`
}

type Action struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Actions    []string `json:"actions"`    // Assuming actions is a list of strings
	Operations []string `json:"operations"` // Assuming operations is a list of strings
	RunStats   []string `json:"runStats"`   // Assuming runStats is a list of strings
}

type EntityList struct {
	Entities []Entity `json:"entities"`
}

// graph associations
type Assoc struct {
	ID               string                 `json:"id"`
	Name             string                 `json:"name"`
	Description      string                 `json:"description"`
	Label            string                 `json:"label"`
	FromEntities     []string               `json:"fromentities"`
	ToEntities       []string               `json:"toentities"`
	OtherEntities    []string               `json:"otherentities"`
	Attributes       map[string]interface{} `json:"attributes"`
	Propensity       int                    `json:"propensity"`
	Expressions      interface{}            `json:"expressions"` // Assuming expressions can be of various types, using interface{} for flexibility
	Created          string                 `json:"created"`
	LastModified     string                 `json:"lastModified"`
	LastModifiedUser string                 `json:"lastModifiedUser"`
}

type AssocList struct {
	Assocs []Assoc `json:"assocs"`
}

// generic response
type Response struct {
	Status string `json:"status"`
}

// risk response
type RiskResponse struct {
	Response string `json:"response"`
}
