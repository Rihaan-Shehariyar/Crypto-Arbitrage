package exchange

import (
	"crypto-arbitrage/internal/feed"
	"encoding/json"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type OKXWS struct{}

func (o OKXWS) Start(f *feed.Feed, symbols []string) {
	go func() {

		url := "wss://ws.okx.com:8443/ws/v5/public"

		conn, _, err := websocket.DefaultDialer.Dial(url, nil)
		if err != nil {
			log.Println("[OKX] connect error:", err)
			return
		}

		log.Println("[OKX] connected")

		args := []map[string]string{}
		for _, s := range symbols {
			args = append(args, map[string]string{
				"channel": "books5",
				"instId":  s,
			})
		}

		sub := map[string]interface{}{
			"op":   "subscribe",
			"args": args,
		}

		conn.WriteJSON(sub)

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Println("[OKX] read error:", err)
				return
			}

			var resp map[string]interface{}
			json.Unmarshal(msg, &resp)

			dataArr, ok := resp["data"].([]interface{})
			if !ok {
				continue
			}

			for _, d := range dataArr {

				m := d.(map[string]interface{})

				symbol := strings.ReplaceAll(m["instId"].(string), "-", "")

				bidsRaw := m["bids"].([]interface{})
				asksRaw := m["asks"].([]interface{})

				var bids []feed.Level
				var asks []feed.Level

				for i := 0; i < len(bidsRaw) && i < 5; i++ {
					entry := bidsRaw[i].([]interface{})
					price, _ := strconv.ParseFloat(entry[0].(string), 64)
					qty, _ := strconv.ParseFloat(entry[1].(string), 64)

					bids = append(bids, feed.Level{Price: price, Amount: qty})
				}

				for i := 0; i < len(asksRaw) && i < 5; i++ {
					entry := asksRaw[i].([]interface{})
					price, _ := strconv.ParseFloat(entry[0].(string), 64)
					qty, _ := strconv.ParseFloat(entry[1].(string), 64)

					asks = append(asks, feed.Level{Price: price, Amount: qty})
				}

				feed.UpdateOrderBook("okx", symbol, feed.OrderBook{
					Bids: bids,
					Asks: asks,
					Time: time.Now().UnixMilli(),
				})

				log.Println("📥 OB UPDATE: okx", symbol)
			}
		}
	}()
}
