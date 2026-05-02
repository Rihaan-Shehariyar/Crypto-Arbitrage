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

// ✅ Correct structure for depth stream
type BinanceDepth struct {
	Stream string `json:"stream"`
	Data struct {
		LastUpdateID int64      `json:"lastUpdateId"`
		Bids         [][]string `json:"bids"`
		Asks         [][]string `json:"asks"`
	} `json:"data"`
}

func (b BinanceWS) Start(f *feed.Feed, symbols []string) {

	streams := []string{}

	for _, s := range symbols {
		streams = append(streams, strings.ToLower(s)+"@depth5@100ms")
	}

	url := "wss://stream.binance.com:9443/stream?streams=" + strings.Join(streams, "/")

	log.Println("[BINANCE WS] connecting:", url)

	conn, _, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		log.Println("Binance WS error:", err)
		return
	}

	log.Println("[BINANCE WS] connected")

	go func() {
		defer conn.Close()

		for {
			_, message, err := conn.ReadMessage()
			if err != nil {
				log.Println("Binance WS read error:", err)
				return
			}

			var msg BinanceDepth

			if err := json.Unmarshal(message, &msg); err != nil {
				continue
			}

			// 🔥 Extract symbol from stream (CRITICAL FIX)
			parts := strings.Split(msg.Stream, "@")
			if len(parts) == 0 {
				continue
			}

			symbol := strings.ToUpper(parts[0])

			var bids []feed.Level
			var asks []feed.Level

			// Parse bids
			for _, b := range msg.Data.Bids {
				price, _ := strconv.ParseFloat(b[0], 64)
				amount, _ := strconv.ParseFloat(b[1], 64)

				bids = append(bids, feed.Level{
					Price:  price,
					Amount: amount,
				})
			}

			// Parse asks
			for _, a := range msg.Data.Asks {
				price, _ := strconv.ParseFloat(a[0], 64)
				amount, _ := strconv.ParseFloat(a[1], 64)

				asks = append(asks, feed.Level{
					Price:  price,
					Amount: amount,
				})
			}

			if len(bids) == 0 || len(asks) == 0 {
				continue
			}

			// ✅ Update OrderBook
			feed.UpdateOrderBook("binance", symbol, feed.OrderBook{
				Bids: bids,
				Asks: asks,
				Time: time.Now().UnixMilli(),
			})

			// ✅ Push into engine
			f.Stream <- feed.Price{
				Exchange: "binance",
				Symbol:   symbol,
				Bid:      bids[0].Price,
				Ask:      asks[0].Price,
				Time:     time.Now().UnixMilli(),
			}

			// 🔍 Debug (keep for now)
			log.Printf("Tick: binance %s %.2f %.2f",
				symbol,
				asks[0].Price,
				bids[0].Price,
			)
		}
	}()
}