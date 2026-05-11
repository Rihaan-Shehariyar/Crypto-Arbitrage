package events

import "crypto-arbitrage/internal/feed"

type OrderBookEvent struct {
	Exchange string

	Symbol string

	OrderBook feed.OrderBook
}
