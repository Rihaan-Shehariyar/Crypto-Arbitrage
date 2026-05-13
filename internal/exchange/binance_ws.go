package exchange

import (
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/kafka"
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
// KAFKA
// -----------------------------------

var kafkaProducer = kafka.NewProducer(
	"localhost:9092",
)

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

func (b *BinanceWS) Subscribe() error {
	return nil
}

// -----------------------------------
// READ LOOP
// -----------------------------------

func (b *BinanceWS) ReadLoop() error {

	for {

		b.conn.SetReadDeadline(
			time.Now().Add(
				30 * time.Second,
			),
		)

		_, msg, err :=
			b.conn.ReadMessage()

		if err != nil {
			return err
		}

		var raw struct {
			Stream string `json:"stream"`

			Data struct {
				Bids [][]string `json:"bids"`
				Asks [][]string `json:"asks"`
			} `json:"data"`
		}

		err = json.Unmarshal(
			msg,
			&raw,
		)

		if err != nil {

			log.Println(
				"[BINANCE] unmarshal failed:",
				err,
			)

			continue
		}

		if !strings.Contains(
			raw.Stream,
			"depth",
		) {
			continue
		}

		parts := strings.Split(
			raw.Stream,
			"@",
		)

		if len(parts) == 0 {
			continue
		}

		symbol := strings.ToUpper(
			parts[0],
		)

		if len(raw.Data.Bids) == 0 ||
			len(raw.Data.Asks) == 0 {

			continue
		}

		now := time.Now().UnixMilli()

		ob := feed.OrderBook{
			Time: now,

			ReceivedAt: now,
		}

		// -----------------------------------
		// BIDS
		// -----------------------------------

		for _, bid := range raw.Data.Bids {

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

		for _, ask := range raw.Data.Asks {

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
		// KAFKA PUBLISH
		// -----------------------------------

		// Binance exchange Kafka publish section ONLY

		err = kafkaProducer.Publish(
			kafka.OrderBookMessage{
				Exchange:   "binance",
				Symbol:     symbol,
				Bids:       ob.Bids,
				Asks:       ob.Asks,
				Ts:         time.Now().UnixMilli(),
				ReceivedAt: ob.ReceivedAt,
			},
		)

		if err != nil {

			log.Println(
				"[KAFKA] publish failed:",
				err,
			)

			continue
		}

		log.Printf(
			"[KAFKA] published %s",
			symbol,
		)
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
