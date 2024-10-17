package db

// generic Db interface
type Db interface {
	Ping() error
	Add(table, key string, value interface{}) error
	Del(table, key string) error
	Get(table, key string) (interface{}, error)
	List(table string) []interface{}
}
