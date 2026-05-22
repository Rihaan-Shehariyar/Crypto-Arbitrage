package service

import (
	"sync"
)

var (
	balances = make(map[string]map[string]float64)
	balMu    sync.RWMutex
)

// UPDATE BALANCE

func UpdateBalance(exchange string, data map[string]float64) {
	balMu.Lock()
	defer balMu.Unlock()

	balances[exchange] = data
}

// GET BALANCE

func GetBalance(exchange string) map[string]float64 {
	balMu.RLock()
	defer balMu.RUnlock()

	return balances[exchange]
}
