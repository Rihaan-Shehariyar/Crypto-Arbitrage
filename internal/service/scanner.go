package service

import (
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/websocket"
	"sort"
	"sync"
	"time"
)

type Opportunity struct {
	Coin      string  `json:"coin"`
	BuyFrom   string  `json:"buy_from"`
	SellTo    string  `json:"sell_to"`
	BuyPrice  float64 `json:"buy_price"`
	SellPrice float64 `json:"sell_price"`
	Profit    float64 `json:"profit"`
	Action    string  `json:"action"`
}

type PriceResult struct {
	Exchange string
	Bid      float64
	Ask      float64
	Err      error
}

var LatestResult map[string]interface{}

var coins = []string{"BTCUSDT", "ETHUSDT", "SOLUSDT"}

var exchanges = []exchange.Exchange{
	exchange.Binance{},
	exchange.Kucoin{},
	exchange.Bybit{},
}

func StartScanner() {

	go func() {
		for {

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

						println("OK:", c, res.Exchange, res.Bid, res.Ask)
						prices[res.Exchange] = res
					}

					println("VALID EXCHANGES:", c, len(prices))

					// Need at least 2 exchanges
					if len(prices) < 2 {
						println("NOT ENOUGH DATA:", c)
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

					println("BEST:", c, bestBuy.Exchange, bestSell.Exchange, bestProfit)

					// Even if negative, send it (for UI visibility)
					action := "Buy " + bestBuy.Exchange + " → Sell " + bestSell.Exchange

					resultsCh <- Opportunity{
						Coin:      c,
						BuyFrom:   bestBuy.Exchange,
						SellTo:    bestSell.Exchange,
						BuyPrice:  bestBuy.Ask,
						SellPrice: bestSell.Bid,
						Profit:    bestProfit,
						Action:    action,
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

			LatestResult = map[string]interface{}{
				"opportunities": results,
				"timestamp":     time.Now(),
			}

			websocket.Broadcast(LatestResult)

			time.Sleep(2 * time.Second)
		}
	}()
}
