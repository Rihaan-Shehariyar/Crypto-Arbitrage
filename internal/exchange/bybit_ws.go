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

	// extract symbol from topic
	// topic = "orderbook.1.BTCUSDT"
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

	bids, ok1 := bidsRaw.([]interface{})
	asks, ok2 := asksRaw.([]interface{})

	if !ok1 || !ok2 || len(bids) == 0 || len(asks) == 0 {
		return
	}

	// --- parse best bid ---
	bidEntry, ok := bids[0].([]interface{})
	if !ok || len(bidEntry) < 1 {
		return
	}

	// --- parse best ask ---
	askEntry, ok := asks[0].([]interface{})
	if !ok || len(askEntry) < 1 {
		return
	}

	bidStr, ok1 := bidEntry[0].(string)
	askStr, ok2 := askEntry[0].(string)

	if !ok1 || !ok2 {
		return
	}

	bid, err1 := strconv.ParseFloat(bidStr, 64)
	ask, err2 := strconv.ParseFloat(askStr, 64)

	if err1 != nil || err2 != nil || bid <= 0 || ask <= 0 {
		return
	}

	// log.Printf(" Bybit %s | Bid: %.2f Ask: %.2f", symbol, bid, ask)

	select {
	case f.Stream <- feed.Price{
		Exchange: "bybit",
		Symbol:   symbol,
		Bid:      bid,
		Ask:      ask,
	}:
	default:
	}
}
