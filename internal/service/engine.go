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

// const DRY_RUN = true

func StartEngine(
	ctx context.Context,
	f *feed.Feed,
	brokers map[string]broker.Broker,
) {
	go func() {

		log.Println("[ENGINE] started (SAFE MODE)")

		fee := 0.001
		slippage := 0.001
		tradeSize := 100.0
		// minProfit := 0.2 // %

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

				// prevent overlapping trades
				if openPositions[price.Symbol] {
					continue
				}

				var bestBuy, bestSell feed.Price
				bestPercent := -999.0

				// 1. FIND BEST OPPORTUNITY
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

				// 2. VALIDATION

				// if bestPercent < minProfit {
				// 	continue
				// }

				if bestPercent < 0.0 {
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
					"ARB %s | BUY %s → SELL %s | %.3f%%",
					price.Symbol,
					bestBuy.Exchange,
					bestSell.Exchange,
					bestPercent,
				)

				websocket.Broadcast(Opportunity{
					Coin:      price.Symbol,
					BuyFrom:   bestBuy.Exchange,
					SellTo:    bestSell.Exchange,
					BuyPrice:  bestBuy.Ask,
					SellPrice: bestSell.Bid,
					Profit:    0, // not executed yet
					Percent:   bestPercent,
				})

				// 3. BALANCE CHECK
				// buyBal, err := buyBroker.GetBalance()
				// if err != nil {
				// 	continue
				// }

				// sellBal, err := sellBroker.GetBalance()
				// if err != nil {
				// 	continue
				// }

				// // if DRY_RUN {
				// // 	log.Println("DRY RUN → skipping execution")
				// // 	continue
				// // }

				// baseAsset := strings.TrimSuffix(price.Symbol, "USDT")

				// if buyBal["USDT"] < tradeSize {
				// 	log.Println("Not enough USDT on BUY exchange")
				// 	continue
				// }

				// estimatedQty := tradeSize / bestBuy.Ask

				// if sellBal[baseAsset] < estimatedQty {
				// 	log.Println("Not enough asset on SELL exchange")
				// 	continue
				// }

				// lock position
				openPositions[price.Symbol] = true

				// 4. EXECUTION
				log.Println("Executing arbitrage...")

				// BUY
				buyOrderId, err := buyBroker.MarketBuy(price.Symbol, tradeSize)
				if err != nil {
					log.Println("BUY error:", err)
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

					log.Println("BUY failed")

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

				log.Printf("BUY filled qty=%.6f price=%.2f",
					buyInfo.FilledQty,
					buyInfo.AvgPrice,
				)

				// NOTIONAL CHECK
				if buyInfo.FilledQty*bestBuy.Bid < 10 {
					log.Println("Too small → skipping SELL")
					openPositions[price.Symbol] = false
					continue
				}

				// SELL
				sellOrderId, err := sellBroker.MarketSell(
					price.Symbol,
					buyInfo.FilledQty,
				)
				if err != nil {
					log.Println("SELL error:", err)
					openPositions[price.Symbol] = false
					continue
				}

				sellInfo, ok := waitForExecution(
					sellBroker,
					price.Symbol,
					sellOrderId,
					buyInfo.FilledQty,
				)

				// 5. FAIL-SAFE SELL
				if !ok || sellInfo.FilledQty == 0 {

					log.Println("SELL failed → retrying...")

					AddTrade(Trade{
						ID:      fmt.Sprintf("%d", time.Now().UnixNano()),
						Coin:    price.Symbol,
						Status:  "SELL_FAILED",
						BuyFrom: bestBuy.Exchange,
						SellTo:  bestSell.Exchange,
						Qty:     buyInfo.FilledQty,
						Error:   "sell failed after retry",
						Time:    time.Now(),
					})

					sellOrderId, err = sellBroker.MarketSell(
						price.Symbol,
						buyInfo.FilledQty,
					)
					if err != nil {
						log.Println("SELL retry failed")

						log.Println("Emergency exit on BUY exchange")
						_, _ = buyBroker.MarketSell(
							price.Symbol,
							buyInfo.FilledQty,
						)

						openPositions[price.Symbol] = false
						continue
					}

					sellInfo, ok = waitForExecution(
						sellBroker,
						price.Symbol,
						sellOrderId,
						buyInfo.FilledQty,
					)

					if !ok || sellInfo.FilledQty == 0 {
						log.Println("SELL retry failed → force exit")
						_, _ = buyBroker.MarketSell(
							price.Symbol,
							buyInfo.FilledQty,
						)

						openPositions[price.Symbol] = false
						continue
					}
				}

				log.Printf("SELL filled qty=%.6f price=%.2f",
					sellInfo.FilledQty,
					sellInfo.AvgPrice,
				)

				// 6. REAL PROFIT
				profit := (sellInfo.AvgPrice*(1-fee) -
					buyInfo.AvgPrice*(1+fee)) * sellInfo.FilledQty

				log.Printf("REAL PROFIT: %.4f USDT", profit)

				// unlock position
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
				// 7. BROADCAST
				websocket.Broadcast(map[string]interface{}{
					"type":  "trade",
					"data":  trade,
					"total": GetTotalPnL(),
				})
			}
		}
	}()
}
