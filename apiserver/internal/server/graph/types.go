package graph

import (
	"github.com/zetafence/zentaris/apiserver/internal/server/db"
)

// Graph defines database of vertices and edges, and corresponding operations
type Graph struct {
	db db.Db
}

// AppData represent a graph application
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

// TBD
type Stats struct {
	NumRuns    int   `json:"numruns"`
	NumQueries int   `json:"numqueries"`
	NumResp    int   `json:"numresp"`
	RunTS      []int `json:"runts"`
}

// list of graph applications
type AppsList struct {
	Apps []AppData `json:"apps"`
}

// Entity represents graph vertices
type Entity struct {
	ID               string            `json:"id"`
	Name             string            `json:"name"`
	Description      string            `json:"description"`
	Kind             string            `json:"kind"`
	Attributes       map[string]string `json:"attributes"`
	Entities         []Entity          `json:"entities"`
	Fitness          int               `json:"fitness"`
	Actions          Action            `json:"actions"`
	Stats            interface{}       `json:"stats"`
	Created          string            `json:"created"`
	LastModified     string            `json:"lastModified"`
	LastModifiedUser string            `json:"lastModifiedUser"`
}

type Action struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Actions    []string `json:"actions"`    // actions is a list of strings
	Operations []string `json:"operations"` // operations is a list of strings
	RunStats   []string `json:"runStats"`   // runStats is a list of strings
}

// list of graph entities
type EntityList struct {
	Entities []Entity `json:"entities"`
}

// Assoc represents graph edges or associations
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
	Expressions      interface{}            `json:"expressions"`
	Created          string                 `json:"created"`
	LastModified     string                 `json:"lastModified"`
	LastModifiedUser string                 `json:"lastModifiedUser"`
}

// list of graph edges
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
