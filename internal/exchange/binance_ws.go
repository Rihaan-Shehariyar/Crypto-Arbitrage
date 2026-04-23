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

type BinanceWS struct{}

func (b BinanceWS) Start(f *feed.Feed, symbols []string) {


	go func() {
		for {
			// build multiplexed stream URL
			streams := make([]string, 0, len(symbols))
			for _, s := range symbols {
				streams = append(streams, strings.ToLower(s)+"@bookTicker")
			}

			url := "wss://stream.binance.com:9443/stream?streams=" + strings.Join(streams, "/")

			conn, _, err := websocket.DefaultDialer.Dial(url, nil)
			if err != nil {
				log.Println("[BINANCE WS] dial error:", err)
				time.Sleep(2 * time.Second)
				continue
			}

			log.Println("[BINANCE WS] connected")

			for {
				_, msg, err := conn.ReadMessage()
				if err != nil {
					log.Println("[BINANCE WS] read error:", err)
					conn.Close()
					time.Sleep(1 * time.Second)
					break // reconnect outer loop
				}

				// log.Println("RAW:", string(msg))

				var resp map[string]interface{}

				if err := json.Unmarshal(msg, &resp); err != nil {
					continue
				}

				data, ok := resp["data"].(map[string]interface{})
				if !ok {
					continue
				}

				// ONLY accept correct fields
				symbol, ok1 := data["s"].(string)
				bidStr, ok2 := data["b"].(string)
				askStr, ok3 := data["a"].(string)

				//   validation
				if !ok1 || !ok2 || !ok3 {
					continue
				}

				bid, err1 := strconv.ParseFloat(bidStr, 64)
				ask, err2 := strconv.ParseFloat(askStr, 64)

				if err1 != nil || err2 != nil || bid <= 0 || ask <= 0 {
					continue
				}
				// log.Printf("Binance %s | Bid: %.2f Ask: %.2f",
				// 	symbol,
				// 	bid,
				// 	ask,
				// )

				f.Stream <- feed.Price{
					Exchange: "binance",
					Symbol:   symbol,
					Bid:      bid,
					Ask:      ask,
				}
			}
		}
	}()
}
