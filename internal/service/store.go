package service

import (
	"crypto-arbitrage/internal/feed"
)

var priceBook = make(map[string]map[string]feed.Price)

// symbol → exchange → price

func UpdatePrice(p feed.Price) {
	if _, ok := priceBook[p.Symbol]; !ok {
		priceBook[p.Symbol] = make(map[string]feed.Price)
	}

	priceBook[p.Symbol][p.Exchange] = p
}

func GetPrices(symbol string) []feed.Price {
	var result []feed.Price

	for _, p := range priceBook[symbol] {
		result = append(result, p)
	}

	return result
}
