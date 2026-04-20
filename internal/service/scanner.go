package service

import (
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/websocket"
	"sort"
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

var LatestResult map[string]interface{}
var coins = []string{"BTCUSDT", "ETHUSDT", "SOLUSDT"}

func StartScanner() {

	go func() {
		for {

			var results []Opportunity

			for _, coin := range coins {
				binanceBid, binanceAsk, _ := exchange.GetBinancePrice(coin)
				kuCoinBid, kuCoinAsk, _ := exchange.GetKuCoinPrice(coin)

				profit1 := kuCoinBid - binanceAsk
				profit2 := binanceBid - kuCoinAsk

				var realProfit float64
				var action string

				if profit1 > profit2 {
					realProfit = profit1
					action = "Buy Binance → Sell KuCoin"
				} else {
					realProfit = profit2
					action = "Buy KuCoin → Sell Binance"
				}

				threshold := -5.0

				if realProfit < threshold {
					continue
				}

				results = append(results, Opportunity{
					Coin:       coin,
					BinanceBid: binanceBid,
					BinanceAsk: binanceAsk,
					KucoinBid:  kuCoinBid,
					KucoinAsk:  kuCoinAsk,
					Profit:     realProfit,
					Action:     action,
				})
			}

			sort.Slice(results, func(i, j int) bool {
				return results[i].Profit >
					results[j].Profit
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
