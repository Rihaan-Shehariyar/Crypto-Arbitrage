package service

import (
	"crypto-arbitrage/internal/feed"
	"sync"
)

var (
	priceStore = make(map[string]map[string]feed.Price)
	mu         sync.RWMutex
)

func UpdatePrice(p feed.Price) {
	mu.Lock()
	defer mu.Unlock()

	if _, ok := priceStore[p.Symbol]; !ok {
		priceStore[p.Symbol] = make(map[string]feed.Price)
	}
	priceStore[p.Symbol][p.Exchange] = p
}

func GetPrices(symbol string) map[string]feed.Price {
	mu.RLock()
	defer mu.RUnlock()
	return priceStore[symbol]
}
