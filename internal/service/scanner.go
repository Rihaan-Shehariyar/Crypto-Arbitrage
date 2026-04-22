package service

import (
	"context"
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/websocket"
	"log"
	"sort"
	"sync"
	"time"
)

type Opportunity struct {
	Coin          string  `json:"coin"`
	BuyFrom       string  `json:"buy_from"`
	SellTo        string  `json:"sell_to"`
	BuyPrice      float64 `json:"buy_price"`
	SellPrice     float64 `json:"sell_price"`
	Profit        float64 `json:"profit"`
	ProfitPercent float64 `json:"profit_percent"`
	Status        string  `json:"status"`
	Action        string  `json:"action"`
}

type PriceResult struct {
	Exchange string
	Bid      float64
	Ask      float64
	Err      error
}

var LatestResult map[string]interface{}

var coins = []string{
	"BTCUSDT",
	"ETHUSDT",
	"SOLUSDT",
	"BNBUSDT",
	"XRPUSDT",
	"ADAUSDT",
	"DOGEUSDT",
	"MATICUSDT",
	"AVAXUSDT",
	"LINKUSDT",
	"LTCUSDT",
	"DOTUSDT",
	"TRXUSDT",
	"ATOMUSDT",
	"NEARUSDT",
}

var exchanges = []exchange.Exchange{
	exchange.Binance{},
	exchange.Kucoin{},
	exchange.Bybit{},
}

func StartScanner(ctx context.Context) {

	go func() {
		for {
			select {
			case <-ctx.Done():
				log.Println("🛑 Scanner shutting down...")
				return
			default:
			}

			resultsCh := make(chan Opportunity, len(coins))
			var wg sync.WaitGroup

			for _, coin := range coins {
				wg.Add(1)

				go func(c string) {
					defer wg.Done()

					ch := make(chan PriceResult, len(exchanges))

					//  Fetch all exchanges
					for _, ex := range exchanges {
						go func(e exchange.Exchange) {
							bid, ask, err := e.GetPrice(c)
							ch <- PriceResult{
								Exchange: e.Name(),
								Bid:      bid,
								Ask:      ask,
								Err:      err,
							}
						}(ex)
					}

					prices := make(map[string]PriceResult)

					// Collect + validate
					for i := 0; i < len(exchanges); i++ {
						res := <-ch

						if res.Err != nil {
							println("ERROR:", c, res.Exchange)
							continue
						}

						if res.Bid == 0 || res.Ask == 0 {
							println("ZERO:", c, res.Exchange)
							continue
						}

						log.Printf("[SCAN] %s | %s | Bid: %.2f Ask: %.2f", c, res.Exchange, res.Bid, res.Ask)

						prices[res.Exchange] = res
					}

					println("VALID EXCHANGES:", c, len(prices))

					if len(prices) < 2 {

						for _, p := range prices {
							resultsCh <- Opportunity{
								Coin:      c,
								BuyFrom:   p.Exchange,
								SellTo:    p.Exchange,
								BuyPrice:  p.Ask,
								SellPrice: p.Bid,
								Profit:    0,
								Action:    "Single exchange data",
							}
							return
						}

						// no data at all
						resultsCh <- Opportunity{
							Coin:      c,
							BuyFrom:   "N/A",
							SellTo:    "N/A",
							BuyPrice:  0,
							SellPrice: 0,
							Profit:    0,
							Action:    "No data",
						}
						return
					}
					//  Find best arbitrage pair
					bestProfit := -1e9
					var bestBuy PriceResult
					var bestSell PriceResult

					fee := 0.001

					for _, buy := range prices {
						for _, sell := range prices {

							if buy.Exchange == sell.Exchange {
								continue
							}

							profit := sell.Bid*(1-fee) - buy.Ask*(1+fee)

							if profit > bestProfit {
								bestProfit = profit
								bestBuy = buy
								bestSell = sell
							}
						}
					}

					profitPercent := 0.0
					if bestBuy.Ask > 0 {
						profitPercent = (bestProfit / bestBuy.Ask) * 100
					}

					log.Printf("[BEST] %s | %s → %s | Profit: %.4f",
						c, bestBuy.Exchange, bestSell.Exchange, bestProfit)
					// Even if negative, send it (for UI visibility)
					action := "Buy " + bestBuy.Exchange + " → Sell " + bestSell.Exchange

					resultsCh <- Opportunity{
						Coin:          c,
						BuyFrom:       bestBuy.Exchange,
						SellTo:        bestSell.Exchange,
						BuyPrice:      bestBuy.Ask,
						SellPrice:     bestSell.Bid,
						Profit:        bestProfit,
						ProfitPercent: profitPercent,
						Action:        action,
					}

				}(coin)
			}

			wg.Wait()
			close(resultsCh)

			var results []Opportunity

			for res := range resultsCh {
				results = append(results, res)
			}

			sort.Slice(results, func(i, j int) bool {
				return results[i].Profit > results[j].Profit
			})

			var bestTrade Opportunity
			if len(results) > 0 {
				bestTrade = results[0]
			}

			LatestResult = map[string]interface{}{
				"opportunities": results,
				"best_trade":    bestTrade,
				"timestamp":     time.Now(),
			}

			websocket.Broadcast(LatestResult)

			select {
			case <-ctx.Done():
				return
			case <-time.After(2 * time.Second):
			}
		}
	}()
}
