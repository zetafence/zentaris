package db

import (
	"fmt"
	"sync"
)

// in memory KV DB
type (
	MemoryEntry map[string]interface{}

	MemoryDb struct {
		// "table" -> map{}
		Rows map[string]MemoryEntry

		// mutex to ensure safe concurrent access
		Mutex sync.RWMutex
	}
)

// NewMemoryDb creates a new in memory DB initialized with a list of tables
func NewMemoryDb(tables ...string) *MemoryDb {
	m := &MemoryDb{
		Rows: make(map[string]MemoryEntry),
	}
	for _, t := range tables {
		m.Rows[t] = make(map[string]interface{})
	}
	return m
}

// Ping returns success if DB is reachable
func (db *MemoryDb) Ping() error {
	return nil
}

// Add adds a new entry on a given table using key
func (db *MemoryDb) Add(table, key string, value interface{}) error {
	db.Mutex.Lock()
	defer db.Mutex.Unlock()

	tab, ok := db.Rows[table]
	if !ok {
		return fmt.Errorf("Add: unable to find table %v", table)
	}
	tab[key] = value
	return nil
}

// Del deletes a given key on a given table
func (db *MemoryDb) Del(table, key string) error {
	db.Mutex.Lock()
	defer db.Mutex.Unlock()

	tab, ok := db.Rows[table]
	if !ok {
		return fmt.Errorf("Del: unable to find table %v", table)
	}
	delete(tab, key)
	return nil
}

// Get returns the value a given key on a given table
func (db *MemoryDb) Get(table, key string) (interface{}, error) {
	db.Mutex.RLock()
	defer db.Mutex.RUnlock()

	tab, ok := db.Rows[table]
	if !ok {
		return nil, fmt.Errorf("Del: unable to find table %v", table)
	}
	val, ok2 := tab[key]
	if !ok2 {
		return nil, fmt.Errorf("Del: unable to find key %v on table %v", key, table)
	}
	return val, nil
}

// List all entries on a given table
func (db *MemoryDb) List(table string) []interface{} {
	db.Mutex.RLock()
	defer db.Mutex.RUnlock()

	ret := make([]interface{}, 0)
	tab, ok := db.Rows[table]
	if !ok {
		return ret
	}
	for _, i := range tab {
		ret = append(ret, i)
	}
	return ret
}
