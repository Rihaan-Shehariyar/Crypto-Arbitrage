package feed

import "sync"

type Level struct {
	Price  float64
	Amount float64
}

type OrderBook struct {
	Bids []Level
	Asks []Level
	Time int64
}

var (
	orderBooks = make(map[string]map[string]OrderBook)
	obMutex    sync.RWMutex
)

func UpdateOrderBook(exchange, symbol string, ob OrderBook) {
	obMutex.Lock()
	defer obMutex.Unlock()

	if orderBooks[symbol] == nil {
		orderBooks[symbol] = make(map[string]OrderBook)
	}
	orderBooks[symbol][exchange] = ob
}

func GetOrderBooks(symbol string) map[string]OrderBook {
	obMutex.RLock()
	defer obMutex.RUnlock()
	return orderBooks[symbol]
}

// -------- weighted pricing --------

func GetWeightedAsk(ob OrderBook, qty float64) float64 {
	total := 0.0
	remaining := qty

	for _, l := range ob.Asks {
		if remaining <= 0 {
			break
		}
		take := min(remaining, l.Amount)
		total += take * l.Price
		remaining -= take
	}

	if remaining > 0 {
		return 0
	}
	return total / qty
}

func GetWeightedBid(ob OrderBook, qty float64) float64 {
	total := 0.0
	remaining := qty

	for _, l := range ob.Bids {
		if remaining <= 0 {
			break
		}
		take := min(remaining, l.Amount)
		total += take * l.Price
		remaining -= take
	}

	if remaining > 0 {
		return 0
	}
	return total / qty
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}