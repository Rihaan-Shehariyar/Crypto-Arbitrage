package exchange

import (
	"crypto-arbitrage/internal/feed"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type BybitWS struct {
	conn *websocket.Conn

	symbols []string
}

// -----------------------------------
// NAME
// -----------------------------------

func (b *BybitWS) Name() string {
	return "BYBIT"
}

// -----------------------------------
// CONNECT
// -----------------------------------

func (b *BybitWS) Connect(
	symbols []string,
) error {

	b.symbols = symbols

	wsURL :=
		"wss://stream.bybit.com/v5/public/spot"

	log.Println(
		"[BYBIT WS] connecting:",
		wsURL,
	)

	conn, _, err := websocket.DefaultDialer.Dial(
		wsURL,
		nil,
	)

	if err != nil {
		return err
	}

	b.conn = conn

	log.Println(
		"[BYBIT WS] connected",
	)

	return nil
}

// -----------------------------------
// SUBSCRIBE
// -----------------------------------

func (b *BybitWS) Subscribe() error {

	var args []string

	for _, s := range b.symbols {

		args = append(
			args,
			"orderbook.1."+strings.ToUpper(s),
		)
	}

	payload := map[string]interface{}{
		"op":   "subscribe",
		"args": args,
	}

	err := b.conn.WriteJSON(payload)

	if err != nil {
		return err
	}

	log.Printf(
		"[BYBIT WS] subscribed: %v",
		args,
	)

	return nil
}

// -----------------------------------
// READ LOOP
// -----------------------------------

func (b *BybitWS) ReadLoop() error {

	for {

		b.conn.SetReadDeadline(
			time.Now().Add(
				30 * time.Second,
			),
		)

		_, msg, err := b.conn.ReadMessage()

		if err != nil {
			return err
		}

		var raw struct {
			Topic string `json:"topic"`

			Data struct {
				Symbol string `json:"s"`

				Bids [][]string `json:"b"`

				Asks [][]string `json:"a"`
			} `json:"data"`
		}

		err = json.Unmarshal(
			msg,
			&raw,
		)

		if err != nil {
			continue
		}

		if raw.Topic == "" {
			continue
		}

		ob := feed.OrderBook{
			Time: time.Now().UnixMilli(),
		}

		// -------------------------
		// BIDS
		// -------------------------

		for _, b := range raw.Data.Bids {

			price := parseFloat(b[0])

			qty := parseFloat(b[1])

			ob.Bids = append(
				ob.Bids,
				feed.Level{
					Price: price,
					Qty:   qty,
				},
			)
		}

		// -------------------------
		// ASKS
		// -------------------------

		for _, a := range raw.Data.Asks {

			price := parseFloat(a[0])

			qty := parseFloat(a[1])

			ob.Asks = append(
				ob.Asks,
				feed.Level{
					Price: price,
					Qty:   qty,
				},
			)
		}

		symbol :=
			strings.ToUpper(
				raw.Data.Symbol,
			)

		feed.UpdateOrderBook(
			"bybit",
			symbol,
			ob,
		)
	}
}

// -----------------------------------
// CLOSE
// -----------------------------------

func (b *BybitWS) Close() error {

	if b.conn != nil {

		log.Println(
			"[BYBIT WS] closed",
		)

		return b.conn.Close()
	}

	return nil
}
