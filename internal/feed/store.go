package feed

import "sync"

var (
	priceStore = make(map[string]map[string]Price)
	priceMutex sync.RWMutex
)

func UpdatePrice(p Price) {
	priceMutex.Lock()
	defer priceMutex.Unlock()

	if priceStore[p.Symbol] == nil {
		priceStore[p.Symbol] = make(map[string]Price)
	}

	priceStore[p.Symbol][p.Exchange] = p
}

func GetPrices(symbol string) []Price {
	priceMutex.RLock()
	defer priceMutex.RUnlock()

	var res []Price
	for _, p := range priceStore[symbol] {
		res = append(res, p)
	}
	return res
}

func GetBestPrice(symbol string) *Price {
	priceMutex.RLock()
	defer priceMutex.RUnlock()

	var best *Price
	for _, p := range priceStore[symbol] {
		if best == nil || p.Ask < best.Ask {
			tmp := p
			best = &tmp
		}
	}
	return best
}
