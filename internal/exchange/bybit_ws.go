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

type BybitWS struct{}

func (b BybitWS) Start(f *feed.Feed, symbols []string) {
	go func() {
		for {

			url := "wss://stream.bybit.com/v5/public/spot"

			log.Println("[BYBIT WS] connecting to:", url)

			conn, _, err := websocket.DefaultDialer.Dial(url, nil)
			if err != nil {
				log.Println("[BYBIT WS] dial error:", err)
				time.Sleep(2 * time.Second)
				continue
			}

			log.Println("[BYBIT WS] connected")

			// 🔥 subscribe
			args := []string{}
			for _, s := range symbols {
				args = append(args, "orderbook.1."+s)
			}

			subMsg := map[string]interface{}{
				"op":   "subscribe",
				"args": args,
			}

			err = conn.WriteJSON(subMsg)
			if err != nil {
				log.Println("[BYBIT WS] subscribe error:", err)
				conn.Close()
				continue
			}

			log.Println("[BYBIT WS] subscribed:", args)

			for {
				_, msg, err := conn.ReadMessage()
				if err != nil {
					log.Println("[BYBIT WS] read error:", err)
					conn.Close()
					break
				}

				// 🔍 DEBUG (enable if needed)
				// log.Println("[BYBIT RAW]", string(msg))

				var resp map[string]interface{}

				if err := json.Unmarshal(msg, &resp); err != nil {
					continue
				}

				// ignore non-data messages
				topic, ok := resp["topic"].(string)
				if !ok || !strings.HasPrefix(topic, "orderbook.") {
					continue
				}

				data := resp["data"]

				switch d := data.(type) {

				case map[string]interface{}:
					processBybitOrderbook(d, topic, f)

				case []interface{}:
					for _, item := range d {
						if m, ok := item.(map[string]interface{}); ok {
							processBybitOrderbook(m, topic, f)
						}
					}
				}
			}
		}

	}()
}
func processBybitOrderbook(data map[string]interface{}, topic string, f *feed.Feed) {

	parts := strings.Split(topic, ".")
	if len(parts) < 3 {
		return
	}
	symbol := parts[2]

	bidsRaw, ok1 := data["b"]
	asksRaw, ok2 := data["a"]

	if !ok1 || !ok2 {
		return
	}

	bidsArr, ok1 := bidsRaw.([]interface{})
	asksArr, ok2 := asksRaw.([]interface{})

	if !ok1 || !ok2 || len(bidsArr) == 0 || len(asksArr) == 0 {
		return
	}

	var bids []feed.Level
	var asks []feed.Level

	// 🔴 parse bids
	for i := 0; i < len(bidsArr) && i < 10; i++ {
		entry, ok := bidsArr[i].([]interface{})
		if !ok || len(entry) < 2 {
			continue
		}

		price, _ := strconv.ParseFloat(entry[0].(string), 64)
		qty, _ := strconv.ParseFloat(entry[1].(string), 64)

		if price > 0 && qty > 0 {
			bids = append(bids, feed.Level{
				Price:  price,
				Amount: qty,
			})
		}
	}

	// 🟢 parse asks
	for i := 0; i < len(asksArr) && i < 10; i++ {
		entry, ok := asksArr[i].([]interface{})
		if !ok || len(entry) < 2 {
			continue
		}

		price, _ := strconv.ParseFloat(entry[0].(string), 64)
		qty, _ := strconv.ParseFloat(entry[1].(string), 64)

		if price > 0 && qty > 0 {
			asks = append(asks, feed.Level{
				Price:  price,
				Amount: qty,
			})
		}
	}

	if len(bids) == 0 || len(asks) == 0 {
		return
	}

	// ✅ THIS IS WHAT YOU WERE MISSING
	feed.UpdateOrderBook("bybit", symbol, feed.OrderBook{
		Bids: bids,
		Asks: asks,
		Time: time.Now().UnixMilli(),
	})

	log.Println("📥 OB UPDATE: bybit", symbol)

	// (optional) still send price
	select {
	case f.Stream <- feed.Price{
		Exchange: "bybit",
		Symbol:   symbol,
		Bid:      bids[0].Price,
		Ask:      asks[0].Price,
		Time:     time.Now().UnixMilli(),
	}:
	default:
	}
}
