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

type GateWS struct{}

func (g GateWS) Start(f *feed.Feed, symbols []string) {
	go func() {

		url := "wss://api.gateio.ws/ws/v4/"
		conn, _, err := websocket.DefaultDialer.Dial(url, nil)
		if err != nil {
			log.Println("[GATE] connect error:", err)
			return
		}
		log.Println("[GATE] connected")

		// Gate uses format BTC_USDT
		gateSymbols := []string{}
		for _, s := range symbols {
			gateSymbols = append(gateSymbols, toGateSymbol(s))
		}

		sub := map[string]interface{}{
			"time":    time.Now().Unix(),
			"channel": "spot.order_book_update",
			"event":   "subscribe",
			"payload": []interface{}{
				gateSymbols,
				"100ms",
			},
		}

		conn.WriteJSON(sub)

		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				log.Println("[GATE] read error:", err)
				return
			}

			var resp map[string]interface{}
			if err := json.Unmarshal(msg, &resp); err != nil {
				continue
			}

			if resp["channel"] != "spot.order_book_update" {
				continue
			}

			result, ok := resp["result"].(map[string]interface{})
			if !ok {
				continue
			}

			sVal, ok := result["s"]
			if !ok {
				continue
			}

			sStr, ok := sVal.(string)
			if !ok || sStr == "" {
				continue
			}

			symbol := fromGateSymbol(sStr)
			bRaw, ok1 := result["b"]
			aRaw, ok2 := result["a"]

			if !ok1 || !ok2 {
				continue
			}

			bidsRaw, ok1 := bRaw.([]interface{})
			asksRaw, ok2 := aRaw.([]interface{})

			if !ok1 || !ok2 {
				continue
			}
			if len(bidsRaw) == 0 || len(asksRaw) == 0 {
				continue
			}

			var bids []feed.Level
			var asks []feed.Level

			for i := 0; i < len(bidsRaw) && i < 10; i++ {
				entry := bidsRaw[i].([]interface{})
				price, _ := strconv.ParseFloat(entry[0].(string), 64)
				qty, _ := strconv.ParseFloat(entry[1].(string), 64)

				if price > 0 && qty > 0 {
					bids = append(bids, feed.Level{Price: price, Amount: qty})
				}
			}

			for i := 0; i < len(asksRaw) && i < 10; i++ {
				entry := asksRaw[i].([]interface{})
				price, _ := strconv.ParseFloat(entry[0].(string), 64)
				qty, _ := strconv.ParseFloat(entry[1].(string), 64)

				if price > 0 && qty > 0 {
					asks = append(asks, feed.Level{Price: price, Amount: qty})
				}
			}

			if len(bids) == 0 || len(asks) == 0 {
				continue
			}

			feed.UpdateOrderBook("gate", symbol, feed.OrderBook{
				Bids: bids,
				Asks: asks,
				Time: time.Now().UnixMilli(),
			})

			log.Println("📥 OB UPDATE: gate", symbol)
		}
	}()
}

func toGateSymbol(s string) string {
	// BTCUSDT → BTC_USDT
	return strings.Replace(s, "USDT", "_USDT", 1)
}

func fromGateSymbol(s string) string {
	// BTC_USDT → BTCUSDT
	return strings.ReplaceAll(s, "_", "")
}
