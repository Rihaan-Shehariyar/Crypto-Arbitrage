package exchange

import (
	"crypto-arbitrage/internal/feed"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type KucoinWS struct{}

func (k KucoinWS) Start(f *feed.Feed, symbols []string) {
	go func() {
		for {

			// -------------------------
			// 1. Get WebSocket token
			// -------------------------
			resp, err := http.Post("https://api.kucoin.com/api/v1/bullet-public", "application/json", nil)
			if err != nil {
				log.Println("[KUCOIN] token error:", err)
				time.Sleep(3 * time.Second)
				continue
			}

			var result struct {
				Data struct {
					Token           string `json:"token"`
					InstanceServers []struct {
						Endpoint     string `json:"endpoint"`
						PingInterval int    `json:"pingInterval"`
					} `json:"instanceServers"`
				} `json:"data"`
			}

			if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
				log.Println("[KUCOIN] decode error:", err)
				resp.Body.Close()
				continue
			}
			resp.Body.Close()

			if len(result.Data.InstanceServers) == 0 {
				log.Println("[KUCOIN] no servers available")
				time.Sleep(3 * time.Second)
				continue
			}

			endpoint := result.Data.InstanceServers[0].Endpoint
			token := result.Data.Token
			pingInterval := result.Data.InstanceServers[0].PingInterval

			url := endpoint + "?token=" + token

			log.Println("[KUCOIN WS] connecting:", url)

			conn, _, err := websocket.DefaultDialer.Dial(url, nil)
			if err != nil {
				log.Println("[KUCOIN WS] dial error:", err)
				time.Sleep(3 * time.Second)
				continue
			}

			log.Println("[KUCOIN WS] connected")

			// -------------------------
			// 2. Start Ping (CRITICAL)
			// -------------------------
			go func() {
				ticker := time.NewTicker(time.Duration(pingInterval/2) * time.Millisecond)
				defer ticker.Stop()

				for range ticker.C {
					err := conn.WriteJSON(map[string]interface{}{
						"id":   time.Now().Unix(),
						"type": "ping",
					})
					if err != nil {
						log.Println("[KUCOIN PING ERROR]", err)
						return
					}
				}
			}()

			// -------------------------
			// 3. Subscribe to symbols
			// -------------------------

			topics := strings.Join(symbols, ",") // BTC-USDT,ETH-USDT,SOL-USDT

			sub := map[string]interface{}{
				"id":             time.Now().Unix(),
				"type":           "subscribe",
				"topic":          "/market/ticker:" + topics,
				"privateChannel": false,
				"response":       true,
			}

			err = conn.WriteJSON(sub)
			if err != nil {
				log.Println("[KUCOIN SUB ERROR]", err)
			}

			log.Println("[KUCOIN SUB]", sub["topic"])

			// -------------------------
			// 4. Read messages loop
			// -------------------------
			for {
				_, msg, err := conn.ReadMessage()
				if err != nil {
					log.Println("[KUCOIN WS] read error:", err)
					conn.Close()
					break
				}

				// log.Println("[KUCOIN RAW]", string(msg))

				var resp map[string]interface{}
				if err := json.Unmarshal(msg, &resp); err != nil {
					continue
				}

				// Only real ticker messages
				msgType, _ := resp["type"].(string)

				if msgType == "pong" {
					continue
				}

				if msgType != "message" {
					continue
				}

				topic, _ := resp["topic"].(string)
				if !strings.Contains(topic, "/market/ticker") {
					continue
				}

				data, ok := resp["data"].(map[string]interface{})
				if !ok {
					continue
				}

				parts := strings.Split(topic, ":")
				if len(parts) < 2 {
					continue
				}

				symbolRaw := parts[1] // BTC-USDT
				symbol := strings.ReplaceAll(symbolRaw, "-", "")

				// Normalize: BTC-USDT → BTCUSDT

				var bid, ask float64

				// --- BID ---
				switch v := data["bestBid"].(type) {
				case string:
					bid, _ = strconv.ParseFloat(v, 64)
				case float64:
					bid = v
				default:
					continue
				}

				// --- ASK ---
				switch v := data["bestAsk"].(type) {
				case string:
					ask, _ = strconv.ParseFloat(v, 64)
				case float64:
					ask = v
				default:
					continue
				}

				if bid <= 0 || ask <= 0 {
					continue
				}

				// log.Printf(" KuCoin %s | Bid: %.2f Ask: %.2f", symbol, bid, ask)

				// Non-blocking send
				select {
				case f.Stream <- feed.Price{
					Exchange: "kucoin",
					Symbol:   symbol,
					Bid:      bid,
					Ask:      ask,
					Time:     time.Now().UnixMilli(),
				}:
				default:
				}
			}
		}
	}()
}
