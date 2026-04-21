package service

import (
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/websocket"
	"sort"
	"sync"
	"time"
)

type Opportunity struct {
	Coin       string  `json:"coin"`
	BinanceBid float64 `json:"binance_bid"`
	BinanceAsk float64 `json:"binance_ask"`
	KucoinBid  float64 `json:"kucoin_bid"`
	KucoinAsk  float64 `json:"kucoin_ask"`
	Profit     float64 `json:"profit"`
	Action     string  `json:"action"`
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

					for i := 0; i < len(exchanges); i++ {
						res := <-ch

						if res.Err != nil {
							continue
						}
						prices[res.Exchange] = res

					}
					binance, ok1 := prices["binance"]
					kucoin, ok2 := prices["kucoin"]

					if !ok1 || !ok2 {
						return
					}

					binanceBid := binance.Bid
					binanceAsk := binance.Ask
					kucoinBid := kucoin.Bid
					kucoinAsk := kucoin.Ask

					println("DEBUG:", c, binanceBid, kucoinBid)
					if binanceBid == 0 || kucoinBid == 0 {
						return
					}

					fee := 0.001

					profit1 := kucoinBid*(1-fee) - binanceAsk*(1+fee)
					profit2 := binanceBid*(1-fee) - kucoinAsk*(1+fee)

					var realProfit float64
					var action string

					if profit1 > profit2 {
						realProfit = profit1
						action = "Buy Binance → Sell KuCoin"
					} else {
						realProfit = profit2
						action = "Buy KuCoin → Sell Binance"
					}

					// threshold := -100.02 //0.2
					// if realProfit < threshold {
					// 	return
					// }

					resultsCh <- Opportunity{
						Coin:       c,
						BinanceBid: binanceBid,
						BinanceAsk: binanceAsk,
						KucoinBid:  kucoinBid,
						KucoinAsk:  kucoinAsk,
						Profit:     realProfit,
						Action:     action,
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
