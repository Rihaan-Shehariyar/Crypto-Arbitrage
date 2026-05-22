
package kafka

import (
	"context"
	"crypto-arbitrage/internal/events"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/metrics"
	"encoding/json"
	"log"
	"time"

	segmentKafka "github.com/segmentio/kafka-go"
)

type Consumer struct {
	reader *segmentKafka.Reader
}

func NewConsumer(
	broker string,
) *Consumer {

	r := segmentKafka.NewReader(
		segmentKafka.ReaderConfig{
			Brokers: []string{broker},
			Topic:   "orderbooks",
			GroupID: "arb-engine",
		},
	)

	return &Consumer{
		reader: r,
	}
}

func (c *Consumer) Start() {

	// log.Println(
	// 	"[KAFKA] consumer started",
	// )

	for {

		msg, err :=
			c.reader.ReadMessage(
				context.Background(),
			)

		if err != nil {

			log.Println(
				"[KAFKA] consume error:",
				err,
			)

			continue
		}

		var obMsg OrderBookMessage

		err = json.Unmarshal(
			msg.Value,
			&obMsg,
		)

		if err != nil {

			log.Println(
				"[KAFKA] unmarshal error:",
				err,
			)

			continue
		}

		// log.Printf(
		// 	"[KAFKA] RECEIVED %s %s",
		// 	obMsg.Exchange,
		// 	obMsg.Symbol,
		// )

		metrics.KafkaMessages.Inc()

		metrics.EventsReceived.Inc()

		// -----------------------------------
		// RESTORE FULL ORDERBOOK
		// -----------------------------------

		ob := feed.OrderBook{
			Time: obMsg.Ts,
			Bids: obMsg.Bids,
			Asks: obMsg.Asks,
		}

		// -----------------------------------
		// PUBLISH EVENT
		// -----------------------------------

		events.Bus <- events.Event{

			Type: "ORDERBOOK",

			Data: events.OrderBookEvent{

				Exchange: obMsg.Exchange,

				Symbol: obMsg.Symbol,

				OrderBook: ob,
			},
		}
		now := time.Now().UnixMilli()
		if obMsg.ReceivedAt > 0 {

			latency :=
				time.Now().UnixMilli() -
					obMsg.ReceivedAt

			metrics.KafkaLatency.Observe(
				float64(latency),
			)
		}
		kafkaLatency :=
			now - obMsg.ReceivedAt

		metrics.KafkaLatency.
			Observe(
				float64(kafkaLatency),
			)

		log.Printf(
			"[LATENCY] kafka=%dms %s %s",
			kafkaLatency,
			obMsg.Exchange,
			obMsg.Symbol,
		)

	}
}
