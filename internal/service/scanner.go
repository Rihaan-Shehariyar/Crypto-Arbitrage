package service

import (
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/websocket"
	"sort"
	"time"
)

var LatestResult map[string]interface{}
var coins = []string{"BTCUSDT", "ETHUSDT", "SOLUSDT"}

func StartScanner() {


	go func() {
		for {

			var results []map[string]interface{}

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

				results = append(results, map[string]interface{}{
					"coin":        coin,
					"binance_bid": binanceBid,
					"binance_ask": binanceAsk,
					"kucoin_bid":  kuCoinBid,
					"kucoin_ask":  kuCoinAsk,
					"real_profit": realProfit,
					"action":      action,
				})
			}

			sort.Slice(results, func(i, j int) bool {
				return results[i]["real_profit"].(float64) >
					results[j]["real_profit"].(float64)
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
