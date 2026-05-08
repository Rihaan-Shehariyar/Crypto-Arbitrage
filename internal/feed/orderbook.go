package feed

import (
	"log"
	"sync"
	"time"
)

type Level struct {
	Price  float64
	Amount float64
    Qty float64
}

type OrderBook struct {
	Bids []Level
	Asks []Level
	Time int64
}

var (
	orderBooks = make(map[string]map[string]OrderBook)

	lastLog = make(map[string]int64)

	obMutex sync.RWMutex
)

// -------------------------
// UPDATE ORDERBOOK
// -------------------------

func UpdateOrderBook(exchange, symbol string, ob OrderBook) {

	obMutex.Lock()
	defer obMutex.Unlock()

	// init symbol map
	if _, ok := orderBooks[symbol]; !ok {
		orderBooks[symbol] = make(map[string]OrderBook)
	}

	// update OB
	orderBooks[symbol][exchange] = ob

	// -------------------------
	// THROTTLED LOGGING
	// -------------------------

	key := exchange + symbol
	now := time.Now().UnixMilli()

	last := lastLog[key]

	if now-last > 2000 {

		log.Println("📥 OB UPDATE:", exchange, symbol)

		lastLog[key] = now
	}
}

// -------------------------
// GET ORDERBOOKS
// -------------------------

func GetOrderBooks(symbol string) map[string]OrderBook {

	obMutex.RLock()
	defer obMutex.RUnlock()

	result := make(map[string]OrderBook)

	books, ok := orderBooks[symbol]
	if !ok {
		return result
	}

	for ex, ob := range books {
		result[ex] = ob
	}

	return result
}
