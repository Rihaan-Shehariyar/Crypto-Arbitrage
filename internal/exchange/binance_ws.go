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

	conn, _, err := websocket.DefaultDialer.Dial(
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

// Binance combined streams
// already subscribe through URL.
// so nothing required here.

func (b *BinanceWS) Subscribe() error {
	return nil
}

// -----------------------------------
// READ LOOP
// -----------------------------------

func (b *BinanceWS) ReadLoop() error {

	for {

		// read timeout safety
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
			"binance",
			symbol,
			ob,
		)

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

func parseFloat(
	value string,
) float64 {

	f, err := strconv.ParseFloat(
		value,
		64,
	)

	if err != nil {
		return 0
	}

	return f
}
