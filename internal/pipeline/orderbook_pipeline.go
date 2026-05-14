package pipeline

import (
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/kafka"
	"crypto-arbitrage/internal/metrics"
)

var producer *kafka.Producer

func Init(
	p *kafka.Producer,
) {

	producer = p
}

func PublishOrderBook(
	exchange string,
	symbol string,
	ob feed.OrderBook,
) {

	if producer == nil {
		return
	}

	err := producer.Publish(

		kafka.OrderBookMessage{

			Exchange: exchange,

			Symbol: symbol,

			Bids: ob.Bids,

			Asks: ob.Asks,

			Ts: ob.Time,

			ReceivedAt: ob.ReceivedAt,
		},
	)

	if err != nil {

		metrics.EngineErrors.Inc()
	}
}
