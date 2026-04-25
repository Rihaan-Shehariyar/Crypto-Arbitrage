package service

import (
	"context"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/websocket"
	"log"
	"strings"
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

		fee := 0.001
		tradeSize := 100.0

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
				// 1. FIND OPPORTUNITY
				// -----------------------------
				for buyEx, buyBook := range books {
					for sellEx, sellBook := range books {

						if buyEx == sellEx {
							continue
						}

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

				// TEMP restriction
				if bestBuyEx != "bybit" || bestSellEx != "bybit" {
					continue
				}

				key := price.Symbol

				if abs(lastOpportunity[key]-bestPercent) < 0.001 {
					continue
				}
				lastOpportunity[key] = bestPercent

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
				// 3. EXECUTION
				// -----------------------------
				log.Println("⚡ Executing trade...")

				before, err := broker.GetBalance()
				if err != nil {
					log.Println("❌ Failed to fetch balance before trade")
					continue
				}

				if before["USDT"] < tradeSize {
					log.Println("❌ Not enough USDT")
					continue
				}

				// BUY
				buyOrderId, err := broker.MarketBuy(price.Symbol, tradeSize)
				if err != nil {
					log.Println("BUY error:", err)
					continue
				}

				buyInfo, ok := waitForExecution(broker, price.Symbol, buyOrderId)
				if !ok || buyInfo == nil || buyInfo.FilledQty == 0 {
					log.Println("❌ BUY failed")
					continue
				}

				log.Printf("🟢 BUY FILLED: Qty=%.6f Price=%.2f",
					buyInfo.FilledQty, buyInfo.AvgPrice)

				if buyInfo.FilledQty <= 0 {
					log.Println("❌ Nothing to sell")
					continue
				}

				// SELL
				sellOrderId, err := broker.MarketSell(price.Symbol, buyInfo.FilledQty)
				if err != nil {
					log.Println("SELL error:", err)
					continue
				}

				sellInfo, ok := waitForExecution(broker, price.Symbol, sellOrderId)
				if !ok || sellInfo == nil || sellInfo.FilledQty == 0 {
					log.Println("❌ SELL failed")
					continue
				}

				log.Printf("🔴 SELL FILLED: Qty=%.6f Price=%.2f",
					sellInfo.FilledQty, sellInfo.AvgPrice)

				// -----------------------------
				// 4. BALANCE TRACKING
				// -----------------------------
				after, err := broker.GetBalance()
				if err != nil {
					log.Println("❌ Failed to fetch balance after trade")
					continue
				}

				log.Println("💼 WALLET BALANCE:")
				for coin, val := range after {
					if val > 0 {
						log.Printf("   %s: %.6f", coin, val)
					}
				}

				log.Println("📊 BALANCE CHANGE:")

				baseAsset := strings.TrimSuffix(price.Symbol, "USDT")

				for coin, afterVal := range after {

					beforeVal := before[coin]
					diff := afterVal - beforeVal

					// ONLY clear traded asset
					if coin == baseAsset && afterVal > 0.00001 {
						log.Printf("⚠️ LEFTOVER %s: %.6f", coin, afterVal)

						symbol := coin + "USDT"
						clearLeftover(broker, symbol, afterVal)
					}

					if abs(diff) > 0.000001 {
						log.Printf("%s: %.6f → %.6f (Δ %.6f)", coin, beforeVal, afterVal, diff)
					}
				}

				// TRUE wallet PnL
				usdtDiff := after["USDT"] - before["USDT"]
				log.Printf("💵 WALLET USDT CHANGE: %.4f", usdtDiff)

				// CALCULATED PnL
				realProfit := (sellInfo.AvgPrice*(1-fee) - buyInfo.AvgPrice*(1+fee)) * sellInfo.FilledQty
				log.Printf("💰 CALCULATED PROFIT: %.4f USDT", realProfit)

				// -----------------------------
				// 5. BROADCAST
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

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}
