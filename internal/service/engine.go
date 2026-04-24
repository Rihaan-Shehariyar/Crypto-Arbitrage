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
var lastTradeTime = make(map[string]int64)

func StartEngine(ctx context.Context, f *feed.Feed, broker *BybitBroker) {
	go func() {
		log.Println("[ENGINE] started")

		fee := 0.001       // 0.1%
		tradeSize := 100.0 // keep small for testnet

		for {
			select {
			case <-ctx.Done():
				log.Println("[ENGINE] shutting down...")
				return

			case price := <-f.Stream:

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

				// -----------------------------
				// 1. FIND BEST OPPORTUNITY
				// -----------------------------
				for buyEx, buyBook := range books {
					for sellEx, sellBook := range books {

						if buyEx == sellEx {
							continue
						}

						// skip stale
						if now-buyBook.Time > 2000 || now-sellBook.Time > 2000 {
							continue
						}

						if len(buyBook.Asks) == 0 || len(sellBook.Bids) == 0 {
							continue
						}

						buyPrice, amount := simulateBuy(buyBook.Asks, tradeSize)
						if buyPrice == 0 || amount == 0 {
							continue
						}

						sellPrice := simulateSell(sellBook.Bids, amount)
						if sellPrice == 0 {
							continue
						}

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

				// -----------------------------
				// 2. VALIDATE
				// -----------------------------
				if bestPercent < 0.1 {
					continue
				}

				if bestBuyEx == "" || bestSellEx == "" {
					continue
				}

				// TEMP: only Bybit execution
				if bestBuyEx != "bybit" || bestSellEx != "bybit" {
					continue
				}

				// Deduplicate opportunity
				key := price.Symbol
				if abs(lastOpportunity[key]-bestPercent) < 0.001 {
					continue
				}
				lastOpportunity[key] = bestPercent

				// Cooldown (3 seconds per symbol)
				if now-lastTradeTime[key] < 3000 {
					continue
				}
				lastTradeTime[key] = now

				log.Printf(
					"🚀 %s | $%.0f | BUY %s → SELL %s | Profit: $%.2f (%.3f%%)",
					price.Symbol,
					tradeSize,
					bestBuyEx,
					bestSellEx,
					bestProfit,
					bestPercent,
				)

				// -----------------------------
				// 3. EXECUTE TRADE
				// -----------------------------
				log.Println("⚡ Executing trade...")

				// BUY
				buyOrderId, err := broker.MarketBuy(price.Symbol, tradeSize)
				if err != nil {
					log.Println("❌ BUY error:", err)
					continue
				}

				if !waitForFill(broker, price.Symbol, buyOrderId) {
					log.Println("❌ BUY not filled")
					continue
				}

				// safer qty (slippage buffer)
				baseQty := (tradeSize / bestBuyPrice) * 0.995

				// SELL
				sellOrderId, err := broker.MarketSell(price.Symbol, baseQty)
				if err != nil {
					log.Println("❌ SELL error:", err)
					continue
				}

				if !waitForFill(broker, price.Symbol, sellOrderId) {
					log.Println("❌ SELL not filled")
					continue
				}

				log.Println("✅ TRADE COMPLETED")

				// -----------------------------
				// 4. BROADCAST
				// -----------------------------
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

// helper
func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
