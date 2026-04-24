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
		tradeSize := 1000.0

		for {
			select {
			case <-ctx.Done():
				log.Println("[ENGINE] shutting down...")
				return

			case price := <-f.Stream:

				// Update ticker cache (optional but useful)
				UpdatePrice(price)

				books := feed.GetOrderBooks(price.Symbol)
				if len(books) < 2 {
					continue
				}

				now := time.Now().UnixMilli()

				bestProfit := 0.0
				bestPercent := 0.0

				var bestBuyEx, bestSellEx string
				var bestBuyPrice, bestSellPrice float64

				// MAIN LOGIC
				for buyEx, buyBook := range books {
					for sellEx, sellBook := range books {

						if buyEx == sellEx {
							continue
						}

						// Skip stale books
						if now-buyBook.Time > 2000 || now-sellBook.Time > 2000 {
							continue
						}

						// Ensure depth exists
						if len(buyBook.Ask) == 0 || len(sellBook.Bids) == 0 {
							continue
						}

						// Simulate real buy
						buyPrice, amount := simulateBuy(buyBook.Ask, tradeSize)
						if buyPrice == 0 || amount == 0 {
							continue
						}

						// Simulate real sell
						sellPrice := simulateSell(sellBook.Bids, amount)
						if sellPrice == 0 {
							continue
						}

						// Calculate real profit
						profit := (sellPrice*(1-fee) - buyPrice*(1+fee)) * amount
						percent := (profit / tradeSize) * 100

						if percent > bestPercent {
							bestPercent = percent
							bestProfit = profit

							bestBuyEx = buyEx
							bestSellEx = sellEx

							bestBuyPrice = buyPrice
							bestSellPrice = sellPrice
						}
					}
				}

				// 🔍 DEBUG (optional)
				// log.Printf("DEBUG %s | Exchanges: %d", price.Symbol, len(books))

				// Filter weak signals
				if bestPercent < 0.05 {
					continue
				}

				// Deduplicate (tolerant)
				key := price.Symbol
				if abs(lastOpportunity[key]-bestPercent) < 0.001 {
					continue
				}
				lastOpportunity[key] = bestPercent

				// 🚀 Final log
				log.Printf(
					"🚀 %s | $%.0f | BUY %s → SELL %s | Profit: $%.2f (%.3f%%)",
					price.Symbol,
					tradeSize,
					bestBuyEx,
					bestSellEx,
					bestProfit,
					bestPercent,
				)

				// Broadcast result
				result := Opportunity{
					Coin:      price.Symbol,
					BuyFrom:   bestBuyEx,
					SellTo:    bestSellEx,
					BuyPrice:  bestBuyPrice,
					SellPrice: bestSellPrice,
					Profit:    bestProfit,
					Percent:   bestPercent,
				}

				websocket.Broadcast(result)
			}
		}
	}()
}

// 🔧 helper
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
