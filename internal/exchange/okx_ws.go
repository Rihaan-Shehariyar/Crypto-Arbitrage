package exchange

import (
	"crypto-arbitrage/internal/feed"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type OKXWS struct {
	conn *websocket.Conn

	symbols []string
}

// -----------------------------------
// NAME
// -----------------------------------

func (o *OKXWS) Name() string {
	return "OKX"
}

// -----------------------------------
// CONNECT
// -----------------------------------

func (o *OKXWS) Connect(
	symbols []string,
) error {

	o.symbols = symbols

	wsURL :=
		"wss://ws.okx.com:8443/ws/v5/public"

	log.Println(
		"[OKX WS] connecting:",
		wsURL,
	)

	conn, _, err := websocket.DefaultDialer.Dial(
		wsURL,
		nil,
	)

	if err != nil {
		return err
	}

	o.conn = conn

	log.Println(
		"[OKX WS] connected",
	)

	return nil
}

// -----------------------------------
// SUBSCRIBE
// -----------------------------------

func (o *OKXWS) Subscribe() error {

	var args []map[string]string

	for _, s := range o.symbols {

		instID :=
			strings.ReplaceAll(
				strings.ToUpper(s),
				"USDT",
				"-USDT",
			)

		args = append(
			args,
			map[string]string{
				"channel": "books5",
				"instId":  instID,
			},
		)
	}

	payload := map[string]interface{}{
		"op":   "subscribe",
		"args": args,
	}

	err := o.conn.WriteJSON(payload)

	if err != nil {
		return err
	}

	log.Printf(
		"[OKX WS] subscribed",
	)

	return nil
}

// -----------------------------------
// HEARTBEAT
// -----------------------------------

func (o *OKXWS) startHeartbeat() {

	go func() {

		ticker := time.NewTicker(
			20 * time.Second,
		)

		defer ticker.Stop()

		for range ticker.C {

			if o.conn == nil {
				return
			}

			err := o.conn.WriteMessage(
				websocket.TextMessage,
				[]byte("ping"),
			)

			if err != nil {

				log.Println(
					"[OKX WS] ping error:",
					err,
				)

				return
			}
		}
	}()
}

// -----------------------------------
// READ LOOP
// -----------------------------------

func (o *OKXWS) ReadLoop() error {

	o.startHeartbeat()

	for {

		o.conn.SetReadDeadline(
			time.Now().Add(
				30 * time.Second,
			),
		)

		_, msg, err := o.conn.ReadMessage()

		if err != nil {
			return err
		}

		// pong response
		if string(msg) == "pong" {
			continue
		}

		var raw struct {
			Arg struct {
				InstID string `json:"instId"`
			} `json:"arg"`

			Data []struct {
				Bids [][]string `json:"bids"`

				Asks [][]string `json:"asks"`
			} `json:"data"`
		}

		err = json.Unmarshal(
			msg,
			&raw,
		)

		if err != nil {
			continue
		}

		if len(raw.Data) == 0 {
			continue
		}

		ob := feed.OrderBook{
			Time: time.Now().UnixMilli(),
		}

		// -------------------------
		// BIDS
		// -------------------------

		for _, b := range raw.Data[0].Bids {

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

		for _, a := range raw.Data[0].Asks {

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
			strings.ReplaceAll(
				raw.Arg.InstID,
				"-",
				"",
			)

		feed.UpdateOrderBook(
			"okx",
			symbol,
			ob,
		)
	}
}

// -----------------------------------
// CLOSE
// -----------------------------------

func (o *OKXWS) Close() error {

	if o.conn != nil {

		log.Println(
			"[OKX WS] closed",
		)

		return o.conn.Close()
	}

	return nil
}
