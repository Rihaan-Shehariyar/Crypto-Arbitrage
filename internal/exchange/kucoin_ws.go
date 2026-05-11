package exchange

import (
	"bytes"
	"crypto-arbitrage/internal/events"
	"crypto-arbitrage/internal/feed"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type KucoinWS struct {
	conn *websocket.Conn

	symbols []string
}

// -----------------------------------
// NAME
// -----------------------------------

func (k *KucoinWS) Name() string {
	return "KUCOIN"
}

// -----------------------------------
// CONNECT
// -----------------------------------

func (k *KucoinWS) Connect(
	symbols []string,
) error {

	k.symbols = symbols

	// -------------------------
	// GET WS TOKEN
	// -------------------------

	reqBody := bytes.NewBuffer([]byte("{}"))

	req, err := http.NewRequest(
		"POST",
		"https://api.kucoin.com/api/v1/bullet-public",
		reqBody,
	)

	if err != nil {
		return err
	}

	client := &http.Client{}

	resp, err := client.Do(req)

	if err != nil {
		return err
	}

	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)

	if err != nil {
		return err
	}

	var tokenResp struct {
		Data struct {
			Token string `json:"token"`

			InstanceServers []struct {
				Endpoint string `json:"endpoint"`
			} `json:"instanceServers"`
		} `json:"data"`
	}

	err = json.Unmarshal(
		body,
		&tokenResp,
	)

	if err != nil {
		return err
	}

	endpoint :=
		tokenResp.Data.InstanceServers[0].Endpoint

	token :=
		tokenResp.Data.Token

	wsURL :=
		endpoint + "?token=" + token

	log.Println(
		"[KUCOIN WS] connecting:",
		wsURL,
	)

	conn, _, err := websocket.DefaultDialer.Dial(
		wsURL,
		nil,
	)

	if err != nil {
		return err
	}

	k.conn = conn

	log.Println(
		"[KUCOIN WS] connected",
	)

	return nil
}

// -----------------------------------
// SUBSCRIBE
// -----------------------------------

func (k *KucoinWS) Subscribe() error {

	for _, s := range k.symbols {

		topic :=
			"/spotMarket/level2Depth5:" +
				strings.ToUpper(s)

		payload := map[string]interface{}{
			"id":             time.Now().Unix(),
			"type":           "subscribe",
			"topic":          topic,
			"response":       true,
			"privateChannel": false,
		}

		err := k.conn.WriteJSON(payload)

		if err != nil {
			return err
		}

		log.Printf(
			"[KUCOIN WS] subscribed: %s",
			topic,
		)
	}

	return nil
}

// -----------------------------------
// READ LOOP
// -----------------------------------

func (k *KucoinWS) ReadLoop() error {

	for {

		k.conn.SetReadDeadline(
			time.Now().Add(
				30 * time.Second,
			),
		)

		_, msg, err := k.conn.ReadMessage()

		if err != nil {
			return err
		}

		var raw struct {
			Topic string `json:"topic"`

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
			continue
		}

		if raw.Topic == "" {
			continue
		}

		ob := feed.OrderBook{
			Time: time.Now().UnixMilli(),
		}

		for _, b := range raw.Data.Bids {

			ob.Bids = append(
				ob.Bids,
				feed.Level{
					Price: parseFloat(b[0]),
					Qty:   parseFloat(b[1]),
				},
			)
		}

		for _, a := range raw.Data.Asks {

			ob.Asks = append(
				ob.Asks,
				feed.Level{
					Price: parseFloat(a[0]),
					Qty:   parseFloat(a[1]),
				},
			)
		}

		symbol :=
			strings.Split(
				raw.Topic,
				":",
			)

		if len(symbol) < 2 {
			continue
		}

		feed.UpdateOrderBook(
			"kucoin",
			symbol[1],
			ob,
		)

		events.Bus <- events.Event{

			Type: "ORDERBOOK",

			Data: events.OrderBookEvent{

				Exchange: "kucoin",

				Symbol: symbol[1],

				OrderBook: ob,
			},
		}
	}
}

// -----------------------------------
// CLOSE
// -----------------------------------

func (k *KucoinWS) Close() error {

	if k.conn != nil {

		log.Println(
			"[KUCOIN WS] closed",
		)

		return k.conn.Close()
	}

	return nil
}
