package exchange

import (
	"crypto-arbitrage/internal/events"
	"crypto-arbitrage/internal/feed"
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
			continue
		}

		if raw.Result.Symbol == "" {
			continue
		}

		ob := feed.OrderBook{
			Time: time.Now().UnixMilli(),
		}

		for _, b := range raw.Result.Bids {

			ob.Bids = append(
				ob.Bids,
				feed.Level{
					Price: parseFloat(b[0]),
					Qty:   parseFloat(b[1]),
				},
			)
		}

		for _, a := range raw.Result.Asks {

			ob.Asks = append(
				ob.Asks,
				feed.Level{
					Price: parseFloat(a[0]),
					Qty:   parseFloat(a[1]),
				},
			)
		}

		symbol :=
			strings.ReplaceAll(
				raw.Result.Symbol,
				"_",
				"",
			)

		feed.UpdateOrderBook(
			"gate",
			symbol,
			ob,
		)

		events.Bus <- events.Event{

			Type: "ORDERBOOK",

			Data: events.OrderBookEvent{

				Exchange: "gate",

				Symbol: symbol,

				OrderBook: ob,
			},
		}
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
