package service

import (
	"context"
	"crypto-arbitrage/broker"
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

var lastTradeTime = make(map[string]int64)

const DRY_RUN = true

func StartEngine(
	ctx context.Context,
	f *feed.Feed,
	brokers map[string]broker.Broker,
) {

	go func() {

		log.Println("[ENGINE] Multi-exchange started")

		fee := 0.001
		tradeSize := 100.0

		for {
			select {

			case <-ctx.Done():
				log.Println("[ENGINE] shutting down...")
				return

			case price := <-f.Stream:

				UpdatePrice(price)

				prices := GetPrices(price.Symbol)
				if len(prices) < 2 {
					continue
				}

				now := time.Now().UnixMilli()

				var bestBuy, bestSell feed.Price
				bestPercent := -999.0

				// 1. FIND BEST CROSS-EXCHANGE

				for _, buy := range prices {
					for _, sell := range prices {

						if buy.Exchange == sell.Exchange {
							continue
						}

						if now-buy.Time > 2000 || now-sell.Time > 2000 {
							continue
						}

						// TEMP TEST

						adjustedSellBid := sell.Bid * 1.002 // +0.2% fake boost

						profit := (adjustedSellBid*(1-fee) - buy.Ask*(1+fee))
						percent := (profit / buy.Ask) * 100

						if percent > bestPercent {
							bestPercent = percent
							bestBuy = buy
							bestSell = sell
						}
					}
				}

				// log.Printf("DEBUG %s | %s | Bid: %.2f Ask: %.2f",
				// 	price.Symbol,
				// 	price.Exchange,
				// 	price.Bid,
				// 	price.Ask,
				// )

				// log.Printf("SPREAD %s | %s→%s = %.4f%%",
				// 	price.Symbol,
				// 	bestBuy.Exchange,
				// 	bestSell.Exchange,
				// 	bestPercent,
				// )

				// log.Printf("BOOK %s → %+v", price.Symbol, priceBook[price.Symbol])

				// 2. VALIDATION

				if bestPercent < 0.01 {
					continue
				}

				key := price.Symbol

				if now-lastTradeTime[key] < 5000 {
					continue
				}
				lastTradeTime[key] = now

				buyBroker := brokers[bestBuy.Exchange]
				sellBroker := brokers[bestSell.Exchange]

				if buyBroker == nil || sellBroker == nil {
					continue
				}

				log.Printf(
					"🚀 ARB %s | BUY %s → SELL %s | %.3f%%",
					price.Symbol,
					bestBuy.Exchange,
					bestSell.Exchange,
					bestPercent,
				)

				// -----------------------------
				// 3. BALANCE CHECK
				// -----------------------------
				buyBal, err := buyBroker.GetBalance()
				if err != nil {
					continue
				}

				sellBal, err := sellBroker.GetBalance()
				if err != nil {
					continue
				}
				if DRY_RUN {
					log.Println("🧪 DRY RUN → skipping execution")
					continue
				}

				baseAsset := strings.TrimSuffix(price.Symbol, "USDT")

				if buyBal["USDT"] < tradeSize {
					log.Println("❌ Not enough USDT on BUY exchange")
					continue
				}

				estimatedQty := tradeSize / bestBuy.Ask

				if sellBal[baseAsset] < estimatedQty {
					log.Println("❌ Not enough asset on SELL exchange")
					continue
				}

				// -----------------------------
				// 4. EXECUTION
				// -----------------------------
				log.Println("⚡ Executing arbitrage...")

				// BUY
				buyOrderId, err := buyBroker.MarketBuy(price.Symbol, tradeSize)
				if err != nil {
					log.Println("BUY error:", err)
					continue
				}

				expectedQty := tradeSize / bestBuy.Ask

				buyInfo, ok := waitForExecution(buyBroker, price.Symbol, buyOrderId, expectedQty)
				if !ok || buyInfo.FilledQty == 0 {
					log.Println("❌ BUY failed")
					continue
				}

				log.Printf("🟢 BUY filled qty=%.6f price=%.2f",
					buyInfo.FilledQty,
					buyInfo.AvgPrice,
				)

				if buyInfo.FilledQty*bestBuy.Bid < 10 {
					log.Println("❌ Too small after fill (NOTIONAL fail)")
				}

				// SELL
				sellOrderId, err := sellBroker.MarketSell(price.Symbol, buyInfo.FilledQty)
				if err != nil {
					log.Println("SELL error:", err)
					continue
				}

				sellInfo, ok := waitForExecution(sellBroker, price.Symbol, sellOrderId, buyInfo.FilledQty)
				if !ok || sellInfo.FilledQty == 0 {
					log.Println("❌ SELL failed")
					continue
				}

				log.Printf("🔴 SELL filled qty=%.6f price=%.2f",
					sellInfo.FilledQty,
					sellInfo.AvgPrice,
				)
				// -----------------------------
				// 5. REAL PROFIT
				// -----------------------------
				profit := (sellInfo.AvgPrice*(1-fee) - buyInfo.AvgPrice*(1+fee)) * sellInfo.FilledQty

				log.Printf("💰 REAL PROFIT: %.4f USDT", profit)

				// -----------------------------
				// 6. BROADCAST
				// -----------------------------
				websocket.Broadcast(Opportunity{
					Coin:      price.Symbol,
					BuyFrom:   bestBuy.Exchange,
					SellTo:    bestSell.Exchange,
					BuyPrice:  buyInfo.AvgPrice,
					SellPrice: sellInfo.AvgPrice,
					Profit:    profit,
					Percent:   bestPercent,
				})

			}
		}
	}()
}
