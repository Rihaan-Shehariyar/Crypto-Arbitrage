package service

import (
	"context"
	"crypto-arbitrage/broker"
	"crypto-arbitrage/internal/feed"
	"crypto-arbitrage/internal/websocket"
	"fmt"
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

var lastTradeTime = make(map[string]int64)
var openPositions = make(map[string]bool)

func StartEngine(
	ctx context.Context,
	f *feed.Feed,
	brokers map[string]broker.Broker,
) {
	go func() {

		log.Println("🚀 Engine started")

		fee := 0.001
		slippage := 0.001
		tradeSize := 10.0

		//  DEMO MODE SWITCH
		demoMode := true

		for {
			select {

			case <-ctx.Done():
				log.Println("🛑 Engine stopped")
				return

			case price := <-f.Stream:

				UpdatePrice(price)

				prices := GetPrices(price.Symbol)
				if len(prices) < 2 {
					continue
				}

				now := time.Now().UnixMilli()

				if openPositions[price.Symbol] {
					continue
				}

				var bestBuy, bestSell feed.Price
				bestPercent := -999.0

				// 🔍 FIND BEST OPPORTUNITY
				for _, buy := range prices {
					for _, sell := range prices {

						if buy.Exchange == sell.Exchange {
							continue
						}

						if now-buy.Time > 2000 || now-sell.Time > 2000 {
							continue
						}

						adjustedBuy := buy.Ask * (1 + slippage)
						adjustedSell := sell.Bid * (1 - slippage)

						profit := (adjustedSell*(1-fee) - adjustedBuy*(1+fee))
						percent := (profit / adjustedBuy) * 100

						if percent > bestPercent {
							bestPercent = percent
							bestBuy = buy
							bestSell = sell
						}
					}
				}

				// 📊 ALWAYS SHOW SPREAD
				// log.Printf("📊 %s | Spread: %.3f%%", price.Symbol, bestPercent)

				// ❌ FILTER
				if bestPercent < -100 {
					continue
				}

				key := price.Symbol
				if now-lastTradeTime[key] < 5000 {
					continue
				}
				lastTradeTime[key] = now

				var buyBroker, sellBroker broker.Broker

				// 🎯 DEMO MODE (force same exchange)
				if demoMode {
					buyBroker = brokers["binance"]
					sellBroker = brokers["binance"]

					bestBuy.Exchange = "binance"
					bestSell.Exchange = "binance"

					log.Println("DEMO MODE: Same-exchange execution")
				} else {
					buyBroker = brokers[bestBuy.Exchange]
					sellBroker = brokers[bestSell.Exchange]
				}

				if buyBroker == nil || sellBroker == nil {
					continue
				}

				// ✅ CLEAN LOG (consistent)
				log.Printf("🚀 ARB %s | BUY %s → SELL %s | %.3f%%",
					price.Symbol,
					bestBuy.Exchange,
					bestSell.Exchange,
					bestPercent,
				)

				// 📡 BROADCAST
				websocket.Broadcast(Opportunity{
					Coin:      price.Symbol,
					BuyFrom:   bestBuy.Exchange,
					SellTo:    bestSell.Exchange,
					BuyPrice:  bestBuy.Ask,
					SellPrice: bestSell.Bid,
					Profit:    0,
					Percent:   bestPercent,
				})

				openPositions[price.Symbol] = true

				log.Println("⚡ Executing arbitrage...")

				// BUY
				buyOrderId, err := buyBroker.MarketBuy(price.Symbol, tradeSize)
				if err != nil {

					log.Println("❌ BUY error:", err)

					AddTrade(Trade{
						ID:     fmt.Sprintf("%d", time.Now().UnixNano()),
						Coin:   price.Symbol,
						Status: "BUY_FAILED",
						Error:  err.Error(),
						Time:   time.Now(),
					})

					openPositions[price.Symbol] = false
					continue
				}

				expectedQty := tradeSize / bestBuy.Ask

				buyInfo, ok := waitForExecution(
					buyBroker,
					price.Symbol,
					buyOrderId,
					expectedQty,
				)

				if !ok || buyInfo.FilledQty == 0 {

					log.Println("❌ BUY failed")

					AddTrade(Trade{
						ID:     fmt.Sprintf("%d", time.Now().UnixNano()),
						Coin:   price.Symbol,
						Status: "BUY_FAILED",
						Error:  "timeout or no fill",
						Time:   time.Now(),
					})

					openPositions[price.Symbol] = false
					continue
				}

				log.Printf("🟢 BUY filled | qty=%.6f price=%.2f",
					buyInfo.FilledQty,
					buyInfo.AvgPrice,
				)

				// SELL
				sellOrderId, err := sellBroker.MarketSell(
					price.Symbol,
					buyInfo.FilledQty,
				)
				if err != nil {

					log.Println("❌ SELL error:", err)

					openPositions[price.Symbol] = false
					continue
				}

				sellInfo, ok := waitForExecution(
					sellBroker,
					price.Symbol,
					sellOrderId,
					buyInfo.FilledQty,
				)

				if !ok || sellInfo.FilledQty == 0 {

					log.Println("❌ SELL failed")

					AddTrade(Trade{
						ID:      fmt.Sprintf("%d", time.Now().UnixNano()),
						Coin:    price.Symbol,
						Status:  "SELL_FAILED",
						BuyFrom: bestBuy.Exchange,
						SellTo:  bestSell.Exchange,
						Qty:     buyInfo.FilledQty,
						Error:   "sell failed",
						Time:    time.Now(),
					})

					openPositions[price.Symbol] = false
					continue
				}

				log.Printf("🔴 SELL filled | qty=%.6f price=%.2f",
					sellInfo.FilledQty,
					sellInfo.AvgPrice,
				)

				// 💰 PROFIT
				profit := (sellInfo.AvgPrice*(1-fee) -
					buyInfo.AvgPrice*(1+fee)) * sellInfo.FilledQty

				log.Printf("💰 PROFIT: %.4f USDT", profit)

				openPositions[price.Symbol] = false

				trade := Trade{
					ID:        fmt.Sprintf("%d", time.Now().UnixNano()),
					Coin:      price.Symbol,
					BuyFrom:   bestBuy.Exchange,
					SellTo:    bestSell.Exchange,
					BuyPrice:  buyInfo.AvgPrice,
					SellPrice: sellInfo.AvgPrice,
					Qty:       sellInfo.FilledQty,
					Profit:    profit,
					Percent:   bestPercent,
					Time:      time.Now(),
				}

				AddTrade(trade)

				websocket.Broadcast(map[string]interface{}{
					"type":  "trade",
					"data":  trade,
					"total": GetTotalPnL(),
				})

				// ✅ STOP AFTER ONE TRADE (for demo)
				if demoMode {
					log.Println("✅ DEMO COMPLETE")
					return
				}
			}
		}
	}()
}