package service

import (
	"context"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/websocket"
	"log"
	"time"
)

type Opportunity struct {
	Coin      string  `json:"coin"`
	BuyFrom   string  `json:"buy_from"`
	SellTo    string  `json:"sell_to"`
	BuyPrice  float64 `json:"buy_price"`
	SellPrice float64 `json:"sell_price"`
	Profit    float64 `json:"profit"`
	Percent   float64 `json:"percent"`
}

var lastOpportunity = make(map[string]float64)

func StartEngine(ctx context.Context, f *feed.Feed) {
	go func() {
		log.Println("[ENGINE] started")

		fee := 0.001 // 0.1%

		for {
			select {
			case <-ctx.Done():
				log.Println("[ENGINE] shutting down...")
				return

			case price := <-f.Stream:

				// 1. update latest price
				UpdatePrice(price)

				// 2. get all prices for symbol
				prices := GetPrices(price.Symbol)
				if len(prices) < 2 {
					continue
				}

				now := time.Now().UnixMilli()

				bestProfit := 0.0
				bestPercent := 0.0
				var bestBuy, bestSell feed.Price

				// 3. find best opportunity
				for _, buy := range prices {
					for _, sell := range prices {

						if buy.Exchange == sell.Exchange {
							continue
						}

						// 🚨 skip stale data (>1s)
						if now-buy.Time > 1000 || now-sell.Time > 1000 {
							continue
						}

						profit := sell.Bid*(1-fee) - buy.Ask*(1+fee)
						percent := (profit / buy.Ask) * 100

						if percent > bestPercent {
							bestPercent = percent
							bestProfit = profit
							bestBuy = buy
							bestSell = sell
						}
					}
				}

				log.Printf("DEBUG %s | %s | Bid: %.2f Ask: %.2f",
					price.Symbol,
					price.Exchange,
					price.Bid,
					price.Ask,
				)

				// 4. filter noise
				if bestPercent < 0.01 {
					continue
				}

				// 5. deduplicate
				key := price.Symbol

				if lastOpportunity[key] == bestPercent {
					continue
				}

				lastOpportunity[key] = bestPercent

				// 6. log clean output
				log.Printf(
					" %s | BUY %s @ %.2f → SELL %s @ %.2f | Profit: %.4f (%.3f%%)",
					price.Symbol,
					bestBuy.Exchange,
					bestBuy.Ask,
					bestSell.Exchange,
					bestSell.Bid,
					bestProfit,
					bestPercent,
				)

				// 7. broadcast clean data
				result := Opportunity{
					Coin:      price.Symbol,
					BuyFrom:   bestBuy.Exchange,
					SellTo:    bestSell.Exchange,
					BuyPrice:  bestBuy.Ask,
					SellPrice: bestSell.Bid,
					Profit:    bestProfit,
					Percent:   bestPercent,
				}

				websocket.Broadcast(result)
			}
		}
	}()
}
