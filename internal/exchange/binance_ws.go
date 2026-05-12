package exchange

import (
	"crypto-arbitrage/internal/events"
	"crypto-arbitrage/internal/feed"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type BinanceWS struct {
	conn *websocket.Conn
}

// -----------------------------------
// NAME
// -----------------------------------

func (b *BinanceWS) Name() string {
	return "BINANCE"
}

// -----------------------------------
// CONNECT
// -----------------------------------

func (b *BinanceWS) Connect(
	symbols []string,
) error {

	var streams []string

	for _, s := range symbols {

		s = strings.ToLower(s)

		streams = append(
			streams,
			fmt.Sprintf(
				"%s@depth5@100ms",
				s,
			),
		)
	}

	wsURL :=
		"wss://stream.binance.com:9443/stream?streams=" +
			strings.Join(streams, "/")

	log.Println(
		"[BINANCE WS] connecting:",
		wsURL,
	)

	conn, _, err :=
		websocket.DefaultDialer.Dial(
			wsURL,
			nil,
		)

	if err != nil {
		return err
	}

	b.conn = conn

	log.Println(
		"[BINANCE WS] connected",
	)

	return nil
}

// -----------------------------------
// SUBSCRIBE
// -----------------------------------

// Binance combined stream already
// subscribes through URL.

func (b *BinanceWS) Subscribe() error {
	return nil
}

// -----------------------------------
// READ LOOP
// -----------------------------------

func (b *BinanceWS) ReadLoop() error {

	for {

		// -----------------------------------
		// READ DEADLINE
		// -----------------------------------

		b.conn.SetReadDeadline(
			time.Now().Add(
				30 * time.Second,
			),
		)

		// -----------------------------------
		// READ MESSAGE
		// -----------------------------------

		_, msg, err :=
			b.conn.ReadMessage()

		if err != nil {
			return err
		}

		// -----------------------------------
		// RAW PAYLOAD
		// -----------------------------------

		var raw struct {
			Stream string `json:"stream"`

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

			log.Println(
				"[BINANCE WS] unmarshal failed:",
				err,
			)

			continue
		}

		// -----------------------------------
		// VALIDATE STREAM
		// -----------------------------------

		if !strings.Contains(
			raw.Stream,
			"depth",
		) {
			continue
		}

		// -----------------------------------
		// SYMBOL
		// -----------------------------------

		symbol :=
			strings.ToUpper(
				raw.Data.Symbol,
			)

		if symbol == "" {
			continue
		}

		// -----------------------------------
		// EMPTY BOOK CHECK
		// -----------------------------------

		if len(raw.Data.Bids) == 0 ||
			len(raw.Data.Asks) == 0 {

			continue
		}

		// -----------------------------------
		// ORDERBOOK
		// -----------------------------------

		ob := feed.OrderBook{
			Time: time.Now().UnixMilli(),
		}

		// -----------------------------------
		// BIDS
		// -----------------------------------

		for _, b := range raw.Data.Bids {

			if len(b) < 2 {
				continue
			}

			price := parseFloat(
				b[0],
			)

			qty := parseFloat(
				b[1],
			)

			if price <= 0 ||
				qty <= 0 {

				continue
			}

			ob.Bids = append(
				ob.Bids,
				feed.Level{

					Price: price,

					Qty: qty,
				},
			)
		}

		// -----------------------------------
		// ASKS
		// -----------------------------------

		for _, a := range raw.Data.Asks {

			if len(a) < 2 {
				continue
			}

			price := parseFloat(
				a[0],
			)

			qty := parseFloat(
				a[1],
			)

			if price <= 0 ||
				qty <= 0 {

				continue
			}

			ob.Asks = append(
				ob.Asks,
				feed.Level{

					Price: price,

					Qty: qty,
				},
			)
		}

		// -----------------------------------
		// FINAL VALIDATION
		// -----------------------------------

		if len(ob.Bids) == 0 ||
			len(ob.Asks) == 0 {

			continue
		}

		// -----------------------------------
		// UPDATE FEED
		// -----------------------------------

		feed.UpdateOrderBook(
			"binance",
			symbol,
			ob,
		)

		log.Printf(
			"📥 OB UPDATE: binance %s",
			symbol,
		)

		// -----------------------------------
		// PUBLISH EVENT
		// -----------------------------------

		events.Bus <- events.Event{

			Type: "ORDERBOOK",

			Data: events.OrderBookEvent{

				Exchange: "binance",

				Symbol: symbol,

				OrderBook: ob,
			},
		}
	}
}

// -----------------------------------
// CLOSE
// -----------------------------------

func (b *BinanceWS) Close() error {

	if b.conn != nil {

		log.Println(
			"[BINANCE WS] closed",
		)

		return b.conn.Close()
	}

	return nil
}

// -----------------------------------
// PARSE FLOAT
// -----------------------------------

func parseFloat(
	value string,
) float64 {

	f, err :=
		strconv.ParseFloat(
			value,
			64,
		)

	if err != nil {
		return 0
	}

	return f
}
