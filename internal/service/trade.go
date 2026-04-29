package service

import (
	"sync"
	"time"
)

type Trade struct {
	ID        string    `json:"id"`
	Coin      string    `json:"coin"`
	BuyFrom   string    `json:"buy_from"`
	SellTo    string    `json:"sell_to"`
	BuyPrice  float64   `json:"buy_price"`
	SellPrice float64   `json:"sell_price"`
	Qty       float64   `json:"qty"`
	Status      string    `json:"status"`
	Error     string    `json:"error"`
	Profit    float64   `json:"profit"`
	Percent   float64   `json:"percent"`
	Time      time.Time `json:"time"`
}

var (
	trades []Trade
	mu     sync.Mutex
)

func AddTrade(t Trade) {
	mu.Lock()
	defer mu.Unlock()

	trades = append(trades, t)
}

func GetTrades() []Trade {
	mu.Lock()
	defer mu.Unlock()

	if trades == nil {
		return []Trade{}
	}

	return trades
}

func GetTotalPnL() float64 {
	mu.Lock()
	defer mu.Unlock()

	total := 0.0
	for _, t := range trades {
		total += t.Profit
	}
	return total
}
