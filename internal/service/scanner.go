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

func StartScanner() {

	go func() {
		for {

			resultsCh := make(chan Opportunity, len(coins))
			var wg sync.WaitGroup

			for _, coin := range coins {
				wg.Add(1)

				go func(c string) {
					defer wg.Done()

					ch := make(chan PriceResult, 2)

					// Binance
					go func() {
						bid, ask, err := exchange.GetBinancePrice(c)
						ch <- PriceResult{"binance", bid, ask, err}
					}()

					// KuCoin
					go func() {
						bid, ask, err := exchange.GetKuCoinPrice(c)
						ch <- PriceResult{"kucoin", bid, ask, err}
					}()

					var binanceBid, binanceAsk float64
					var kucoinBid, kucoinAsk float64

					for i := 0; i < 2; i++ {
						res := <-ch

						if res.Err != nil {
							return
						}

						switch res.Exchange {
						case "binance":
							binanceBid = res.Bid
							binanceAsk = res.Ask
						case "kucoin":
							kucoinBid = res.Bid
							kucoinAsk = res.Ask
						}
					}

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

					threshold := -5.02  //0.2
					if realProfit < threshold {
						return
					}

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
