// okx_ws.go

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

type OKXWS struct {
	conn *websocket.Conn
}

var okxKafkaProducer = kafka.NewProducer(
	"localhost:9092",
)

func (o *OKXWS) Name() string {
	return "OKX"
}

func (o *OKXWS) Connect(
	symbols []string,
) error {

	url := "wss://ws.okx.com:8443/ws/v5/public"

	log.Println(
		"[OKX WS] connecting:",
		url,
	)

	conn, _, err :=
		websocket.DefaultDialer.Dial(
			url,
			nil,
		)

	if err != nil {
		return err
	}

	o.conn = conn

	log.Println(
		"[OKX WS] connected",
	)

	args := []map[string]string{}

	for _, symbol := range symbols {

		instID :=
			strings.ToUpper(
				symbol[:len(symbol)-4],
			) + "-USDT"

		args = append(
			args,
			map[string]string{
				"channel": "books5",
				"instId":  instID,
			},
		)
	}

	sub := map[string]interface{}{
		"op":   "subscribe",
		"args": args,
	}

	err = o.conn.WriteJSON(sub)

	if err != nil {
		return err
	}

	log.Printf(
		"[OKX WS] subscribed: %v",
		args,
	)

	return nil
}

func (o *OKXWS) Subscribe() error {
	return nil
}

func (o *OKXWS) ReadLoop() error {

	for {

		_, msg, err :=
			o.conn.ReadMessage()

		if err != nil {
			return err
		}

		var raw struct {
			Data []struct {
				InstID string     `json:"instId"`
				Bids   [][]string `json:"bids"`
				Asks   [][]string `json:"asks"`
			} `json:"data"`
		}

		err = json.Unmarshal(
			msg,
			&raw,
		)

		if err != nil {

			metrics.EngineErrors.Inc()

			continue
		}

		if len(raw.Data) == 0 {
			continue
		}

		data := raw.Data[0]

		symbol :=
			strings.ReplaceAll(
				data.InstID,
				"-",
				"",
			)

		now := time.Now().UnixMilli()

		ob := feed.OrderBook{
			Time: now,

			ReceivedAt: now,
		}

		// BIDS

		for _, bid := range data.Bids {

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

		// ASKS

		for _, ask := range data.Asks {

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
			"okx",
			symbol,
			ob,
		)

		pipeline.PublishOrderBook(
			"okx",
			symbol,
			ob,
		)
		log.Printf(
			"📥 OB UPDATE: okx %s",
			symbol,
		)

		err = okxKafkaProducer.Publish(
			kafka.OrderBookMessage{
				Exchange:   "okx",
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
		// 	"[KAFKA] published okx %s",
		// 	symbol,
		// )
	}
}

func (o *OKXWS) Close() error {

	if o.conn != nil {

		log.Println(
			"[OKX WS] closed",
		)

		return o.conn.Close()
	}

	return nil
}
