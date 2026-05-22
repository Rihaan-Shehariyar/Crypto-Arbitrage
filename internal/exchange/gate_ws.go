package exchange

import (
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/kafka"
	"crypto-arbitrage/internal/metrics"
	"crypto-arbitrage/internal/pipeline"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type GateWS struct {
	conn *websocket.Conn

	symbols []string
}

// -----------------------------------
// KAFKA
// -----------------------------------

var gateKafkaProducer = kafka.NewProducer(
	"localhost:9092",
)

// -----------------------------------
// NAME
// -----------------------------------

func (g *GateWS) Name() string {
	return "GATE"
}

// -----------------------------------
// CONNECT
// -----------------------------------

func (g *GateWS) Connect(
	symbols []string,
) error {

	g.symbols = symbols

	wsURL :=
		"wss://api.gateio.ws/ws/v4/"

	log.Println(
		"[GATE WS] connecting:",
		wsURL,
	)

	conn, _, err := websocket.DefaultDialer.Dial(
		wsURL,
		nil,
	)

	if err != nil {
		return err
	}

	g.conn = conn

	log.Println(
		"[GATE WS] connected",
	)

	return nil
}

// -----------------------------------
// SUBSCRIBE
// -----------------------------------

func (g *GateWS) Subscribe() error {

	for _, s := range g.symbols {

		symbol :=
			strings.ReplaceAll(
				strings.ToUpper(s),
				"USDT",
				"_USDT",
			)

		payload := map[string]interface{}{
			"time":    time.Now().Unix(),
			"channel": "spot.order_book_update",
			"event":   "subscribe",
			"payload": []string{
				symbol,
				"100ms",
			},
		}

		err := g.conn.WriteJSON(payload)

		if err != nil {
			return err
		}

		log.Printf(
			"[GATE WS] subscribed: %s",
			symbol,
		)
	}

	return nil
}

// -----------------------------------
// READ LOOP
// -----------------------------------

func (g *GateWS) ReadLoop() error {

	for {

		g.conn.SetReadDeadline(
			time.Now().Add(
				30 * time.Second,
			),
		)

		_, msg, err := g.conn.ReadMessage()

		if err != nil {

			metrics.EngineErrors.Inc()

			return err
		}

		var raw struct {
			Result struct {
				Symbol string `json:"s"`

				Bids [][]string `json:"b"`

				Asks [][]string `json:"a"`
			} `json:"result"`
		}

		err = json.Unmarshal(
			msg,
			&raw,
		)

		if err != nil {

			metrics.EngineErrors.Inc()

			log.Println(
				"[GATE] unmarshal failed:",
				err,
			)

			continue
		}

		// -----------------------------------
		// EMPTY SYMBOL
		// -----------------------------------

		if raw.Result.Symbol == "" {
			continue
		}

		// -----------------------------------
		// EMPTY BOOKS
		// -----------------------------------

		if len(raw.Result.Bids) == 0 ||
			len(raw.Result.Asks) == 0 {

			continue
		}

		// -----------------------------------
		// ORDERBOOK
		// -----------------------------------

		now := time.Now().UnixMilli()

		ob := feed.OrderBook{
			Time: now,

			ReceivedAt: now,
		}
		// -----------------------------------
		// BIDS
		// -----------------------------------

		for _, bid := range raw.Result.Bids {

			if len(bid) < 2 {
				continue
			}

			price := parseFloat(
				bid[0],
			)

			qty := parseFloat(
				bid[1],
			)

			if price <= 0 ||
				qty <= 0 {

				continue
			}

			ob.Bids = append(
				ob.Bids,
				feed.Level{
					Price: price,
					Qty:   qty,
				},
			)
		}

		// -----------------------------------
		// ASKS
		// -----------------------------------

		for _, ask := range raw.Result.Asks {

			if len(ask) < 2 {
				continue
			}

			price := parseFloat(
				ask[0],
			)

			qty := parseFloat(
				ask[1],
			)

			if price <= 0 ||
				qty <= 0 {

				continue
			}

			ob.Asks = append(
				ob.Asks,
				feed.Level{
					Price: price,
					Qty:   qty,
				},
			)
		}

		// -----------------------------------
		// VALIDATE FINAL BOOK
		// -----------------------------------

		if len(ob.Bids) == 0 ||
			len(ob.Asks) == 0 {

			continue
		}

		// -----------------------------------
		// NORMALIZE SYMBOL
		// -----------------------------------

		symbol :=
			strings.ReplaceAll(
				raw.Result.Symbol,
				"_",
				"",
			)

		// -----------------------------------
		// UPDATE FEED
		// -----------------------------------

		feed.UpdateOrderBook(
			"gate",
			symbol,
			ob,
		)
		pipeline.PublishOrderBook(
			"gate",
			symbol,
			ob,
		)

		// -----------------------------------
		// METRICS
		// -----------------------------------

		log.Printf(
			"📥 OB UPDATE: gate %s",
			symbol,
		)

		// -----------------------------------
		// KAFKA PUBLISH
		// -----------------------------------

		err = gateKafkaProducer.Publish(
			kafka.OrderBookMessage{
				Exchange:   "gate",
				Symbol:     symbol,
				Bids:       ob.Bids,
				Asks:       ob.Asks,
				Ts:         ob.Time,
				ReceivedAt: ob.ReceivedAt,
			},
		)

		if err != nil {

			metrics.EngineErrors.Inc()

			log.Println(
				"[KAFKA] publish failed:",
				err,
			)

			continue
		}

		// log.Printf(
		// 	"[KAFKA] published gate %s",
		// 	symbol,
		// )
	}
}

// -----------------------------------
// CLOSE
// -----------------------------------

func (g *GateWS) Close() error {

	if g.conn != nil {

		log.Println(
			"[GATE WS] closed",
		)

		return g.conn.Close()
	}

	return nil
}
