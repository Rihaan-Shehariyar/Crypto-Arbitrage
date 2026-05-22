package exchange

import (
	"bytes"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/kafka"
	"crypto-arbitrage/internal/metrics"
	"crypto-arbitrage/internal/pipeline"
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
// KAFKA
// -----------------------------------

var kucoinKafkaProducer = kafka.NewProducer(
	"localhost:9092",
)

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

			metrics.EngineErrors.Inc()

			return err
		}

		var raw struct {
			Type string `json:"type"`

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

			metrics.EngineErrors.Inc()

			log.Println(
				"[KUCOIN] unmarshal failed:",
				err,
			)

			continue
		}

		// -----------------------------------
		// VALID MESSAGE
		// -----------------------------------

		if raw.Type != "message" {
			continue
		}

		if raw.Topic == "" {
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

		// -----------------------------------
		// VALIDATE BOOK
		// -----------------------------------

		if len(ob.Bids) == 0 ||
			len(ob.Asks) == 0 {

			continue
		}

		// -----------------------------------
		// SYMBOL
		// -----------------------------------

		parts :=
			strings.Split(
				raw.Topic,
				":",
			)

		if len(parts) < 2 {
			continue
		}

		symbol :=
			strings.ReplaceAll(
				parts[1],
				"-",
				"",
			)

		// -----------------------------------
		// UPDATE FEED
		// -----------------------------------

		feed.UpdateOrderBook(
			"kucoin",
			symbol,
			ob,
		)
		pipeline.PublishOrderBook(
			"kucoin",
			symbol,
			ob,
		)
		// -----------------------------------
		// METRICS
		// -----------------------------------

		log.Printf(
			"📥 OB UPDATE: kucoin %s",
			symbol,
		)

		// -----------------------------------
		// KAFKA PUBLISH
		// -----------------------------------

		err = kucoinKafkaProducer.Publish(
			kafka.OrderBookMessage{
				Exchange:   "kucoin",
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
		// 	"[KAFKA] published kucoin %s",
		// 	symbol,
		// )
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
