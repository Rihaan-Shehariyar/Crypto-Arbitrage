package feed

import (
	"log"
	"strings"
	"time"
)

type Level struct {
	Price  float64
	Amount float64
}

type OrderBook struct {
	Bids []Level
	Asks []Level
	Time int64
}

var OrderBooks = make(map[string]map[string]OrderBook)
var lastUpdate = make(map[string]int64)

func UpdateOrderBook(exchange, symbol string, ob OrderBook) {
	symbol = strings.ToUpper(symbol)

	now := time.Now().UnixMilli()

	if now-lastUpdate[exchange+symbol] < 100 {
		return // drop noisy updates
	}

	lastUpdate[exchange+symbol] = now

	if OrderBooks[symbol] == nil {
		OrderBooks[symbol] = make(map[string]OrderBook)
	}
	log.Println("📥 OB UPDATE:", exchange, symbol)
	OrderBooks[symbol][exchange] = ob
}

func GetOrderBooks(symbol string) map[string]OrderBook {
	return OrderBooks[strings.ToUpper(symbol)]

}
