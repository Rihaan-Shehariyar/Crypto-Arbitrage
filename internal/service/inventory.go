package service

import "sync"

var invMu sync.RWMutex

// exchange -> asset -> amount
var inventorys = map[string]map[string]float64{}

func UpdateInventory(exchange string, bal map[string]float64) {
	invMu.Lock()
	defer invMu.Unlock()
	inventorys[exchange] = bal
}

func GetInventory(exchange, asset string) float64 {
	invMu.RLock()
	defer invMu.RUnlock()

	if inventorys[exchange] == nil {
		return 0
	}
	return inventorys[exchange][asset]
}
