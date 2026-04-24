package feed

type Level struct {
	Price  float64
	Amount float64
}

type OrderBook struct {
	Bids []Level
	Asks  []Level
	Time int64
}

var OrderBooks = make(map[string]map[string]OrderBook)

func UpdateOrderBook(exchange, symbol string, ob OrderBook) {
	if OrderBooks[symbol] == nil {
		OrderBooks[symbol] = make(map[string]OrderBook)
	}
	OrderBooks[symbol][exchange] = ob
}

func GetOrderBooks(symbol string) map[string]OrderBook {
	return OrderBooks[symbol]
}

