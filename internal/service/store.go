package service

import (
	"crypto-arbitrage/internal/feed"
	"strings"
	"sync"
	"time"
)

// 🔒 thread-safe storage
var (
	priceBook = make(map[string]map[string]feed.Price)
	mu        sync.RWMutex
)

// -------------------------
// UPDATE PRICE
// -------------------------

func UpdatePrice(p feed.Price) {

	symbol := strings.ToUpper(p.Symbol)

	mu.Lock()
	defer mu.Unlock()

	if _, ok := priceBook[symbol]; !ok {
		priceBook[symbol] = make(map[string]feed.Price)
	}

	priceBook[symbol][p.Exchange] = p
}

// -------------------------
// GET ALL PRICES
// -------------------------

func GetPrices(symbol string) []feed.Price {

	symbol = strings.ToUpper(symbol)

	mu.RLock()
	defer mu.RUnlock()

	var result []feed.Price

	for _, p := range priceBook[symbol] {

		// 🔥 filter stale data (>2s old)
		if time.Now().UnixMilli()-p.Time > 2000 {
			continue
		}

		result = append(result, p)
	}

	return result
}

// -------------------------
// BEST BUY (LOWEST ASK)
// -------------------------

func GetBestBuy(symbol string) *feed.Price {

	prices := GetPrices(symbol)

	var best *feed.Price

	for i := range prices {
		p := &prices[i]

		if best == nil || p.Ask < best.Ask {
			best = p
		}
	}

	return best
}

// -------------------------
// BEST SELL (HIGHEST BID)
// -------------------------

func GetBestSell(symbol string) *feed.Price {

	prices := GetPrices(symbol)

	var best *feed.Price

	for i := range prices {
		p := &prices[i]

		if best == nil || p.Bid > best.Bid {
			best = p
		}
	}

	return best
}
