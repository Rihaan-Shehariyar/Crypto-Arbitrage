package service

import (
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/websocket"
	"time"
)

var LatestResult map[string]interface{}
var coins = []string{"BTCUSDT", "ETHUSDT", "SOLUSDT"}

func StartScanner() {

	go func() {
		for {

			results := make(map[string]interface{})

			for _, coin := range coins {
				binanceAsk, binanceBid, _ := exchange.GetBinancePrice(coin)
				kuCoinAsk, kuCoinBid, _ := exchange.GetKuCoinPrice(coin)

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

				threshold := 0.0
				if realProfit < threshold {
					action = "No profitable arbitrage"
				}

				results[coin] = map[string]interface{}{
					"binance_bid": binanceBid,
					"binance_ask": binanceAsk,
					"kucoin_bid":  kuCoinBid,
					"kucoin_ask":  kuCoinAsk,
					"real_profit": realProfit,
					"action":      action,
				}
			}
			LatestResult = results

			websocket.Broadcast(LatestResult)
			time.Sleep(2 * time.Second)

		}

	}()
}
