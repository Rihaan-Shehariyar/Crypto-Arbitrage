package exchange

import (
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/kafka"
	"crypto-arbitrage/internal/metrics"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type BybitWS struct {
	conn *websocket.Conn
}

var bybitKafkaProducer = kafka.NewProducer(
	"localhost:9092",
)

func (b *BybitWS) Name() string {
	return "BYBIT"
}

func (b *BybitWS) Connect(
	symbols []string,
) error {

	url := "wss://stream.bybit.com/v5/public/spot"

	log.Println(
		"[BYBIT WS] connecting:",
		url,
	)

	conn, _, err := websocket.DefaultDialer.Dial(
		url,
		nil,
	)

	if err != nil {
		return err
	}

	b.conn = conn

	log.Println(
		"[BYBIT WS] connected",
	)

	args := []string{}

	for _, symbol := range symbols {

		args = append(
			args, "orderbook.1."+strings.ToUpper(symbol),
		)
	}

	sub := map[string]interface{}{
		"op":   "subscribe",
		"args": args,
	}

	return b.conn.WriteJSON(sub)
}

func (b *BybitWS) Subscribe() error {
	return nil
}

func (b *BybitWS) ReadLoop() error {

	for {

		_, msg, err := b.conn.ReadMessage()

		if err != nil {
			return err
		}

		var raw struct {
			Topic string `json:"topic"`

			Data struct {
				Symbol string     `json:"s"`
				Bids   [][]string `json:"b"`
				Asks   [][]string `json:"a"`
			} `json:"data"`
		}

		err = json.Unmarshal(msg, &raw)

		if err != nil {

			metrics.EngineErrors.Inc()
			continue
		}

		if raw.Data.Symbol == "" {
			continue
		}

		ob := feed.OrderBook{
			Time: time.Now().UnixMilli(),
		}

		for _, bid := range raw.Data.Bids {

			if len(bid) < 2 {
				continue
			}

			ob.Bids = append(
				ob.Bids,
				feed.Level{
					Price: parseFloat(bid[0]),
					Qty:   parseFloat(bid[1]),
				},
			)
		}

		for _, ask := range raw.Data.Asks {

			if len(ask) < 2 {
				continue
			}

			ob.Asks = append(
				ob.Asks,
				feed.Level{
					Price: parseFloat(ask[0]),
					Qty:   parseFloat(ask[1]),
				},
			)
		}

		if len(ob.Bids) == 0 ||
			len(ob.Asks) == 0 {
			continue
		}

		feed.UpdateOrderBook(
			"bybit",
			raw.Data.Symbol,
			ob,
		)

		log.Printf(
			"📥 OB UPDATE: bybit %s",
			raw.Data.Symbol,
		)

		err = bybitKafkaProducer.Publish(
			kafka.OrderBookMessage{
				Exchange: "bybit", Symbol: raw.Data.Symbol,
				Bids: ob.Bids,
				Asks: ob.Asks,
				Ts:   ob.Time,
			},
		)

		if err != nil {

			metrics.EngineErrors.Inc()

			log.Println(
				"[KAFKA] publish failed:",
				err,
			)
		}
	}
}
func (b *BybitWS) Close() error {

	if b.conn != nil {

		log.Println(
			"[BYBIT WS] closed",
		)

		return b.conn.Close()
	}

	return nil
}
