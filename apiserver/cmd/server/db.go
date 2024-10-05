package main

import (
	"sync"
)

// in-memory KV DB
type InMemoryDB struct {
	// tables
	graph    map[string]interface{}
	entities map[string]interface{}
	assocs   map[string]interface{}

	// Mutex to ensure safe concurrent access
	mu sync.RWMutex // Mutex to ensure safe concurrent access
}
