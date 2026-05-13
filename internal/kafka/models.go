package kafka

import "crypto-arbitrage/internal/feed"

type OrderBookMessage struct {
	Exchange string

	Symbol string

	Bids []feed.Level

	Asks []feed.Level

	Ts int64

	ReceivedAt int64
}
