package scenarios

import (
	"github.com/zetafence/zentaris/apiserver/internal/server/db"
)

// Scenario represents attack graph scenario
type Scenario struct {
	db db.Db
}
