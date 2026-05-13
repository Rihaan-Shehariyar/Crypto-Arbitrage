package feed

import (
	"crypto-arbitrage/internal/metrics"
	"sync"
	"time"
)

// -----------------------------------
// LEVEL
// -----------------------------------

type Level struct {
	Price float64

	// legacy
	Amount float64

	// normalized qty
	Qty float64
}

// -----------------------------------
// ORDERBOOK
// -----------------------------------

type OrderBook struct {
	Bids []Level
	Asks []Level

	// exchange event timestamp
	Time int64

	// ingestion timestamp
	ReceivedAt int64
}

// -----------------------------------
// STORAGE
// -----------------------------------

var (

	// symbol -> exchange -> orderbook
	orderBooks =
		make(
			map[string]map[string]OrderBook,
		)

	// throttled logs
	lastLog =
		make(map[string]int64)

	obMutex sync.RWMutex
)

// -----------------------------------
// UPDATE ORDERBOOK
// -----------------------------------

func UpdateOrderBook(
	exchange string,
	symbol string,
	ob OrderBook,
) {

	obMutex.Lock()
	defer obMutex.Unlock()

	// -----------------------------------
	// INIT SYMBOL MAP
	// -----------------------------------

	if _, ok :=
		orderBooks[symbol]; !ok {

		orderBooks[symbol] =
			make(
				map[string]OrderBook,
			)
	}

	// -----------------------------------
	// UPDATE
	// -----------------------------------

	orderBooks[symbol][exchange] =
		ob

	// -----------------------------------
	// METRICS
	// -----------------------------------

	metrics.ExchangeUpdates.
		WithLabelValues(exchange).
		Inc()

	// -----------------------------------
	// THROTTLED LOGGING
	// -----------------------------------

	key := exchange + symbol

	now :=
		time.Now().UnixMilli()

	last :=
		lastLog[key]

	if now-last > 2000 {

		// OPTIONAL DEBUG
		// log.Printf(
		// 	"📥 OB UPDATE: %s %s",
		// 	exchange,
		// 	symbol,
		// )

		lastLog[key] = now
	}
}

// -----------------------------------
// GET ORDERBOOKS
// -----------------------------------

func GetOrderBooks(
	symbol string,
) map[string]OrderBook {

	obMutex.RLock()
	defer obMutex.RUnlock()

	result :=
		make(
			map[string]OrderBook,
		)

	books, ok :=
		orderBooks[symbol]

	if !ok {
		return result
	}

	for exchange, ob :=
		range books {

		result[exchange] = ob
	}

	return result
}

// -----------------------------------
// GET SINGLE ORDERBOOK
// -----------------------------------

func GetOrderBook(
	exchange string,
	symbol string,
) (OrderBook, bool) {

	obMutex.RLock()
	defer obMutex.RUnlock()

	books, ok :=
		orderBooks[symbol]

	if !ok {

		return OrderBook{}, false
	}

	ob, exists :=
		books[exchange]

	return ob, exists
}

// -----------------------------------
// TOTAL BOOKS
// -----------------------------------

func TotalBooks() int {

	obMutex.RLock()
	defer obMutex.RUnlock()

	total := 0

	for _, books :=
		range orderBooks {

		total += len(books)
	}

	return total
}