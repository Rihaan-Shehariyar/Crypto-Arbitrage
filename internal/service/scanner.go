package service

import (
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/websocket"
	"time"
)

var LatestResult map[string]interface{}

func StartScanner() {

	go func() {
		for {

			binanceBid, binanceAsk, _ := exchange.GetBinanceBTCPrice()
			kuCoinBid, kuCoinAsk, _ := exchange.GetKuCoinBTCPrice()

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

			// Store latest result
			LatestResult = map[string]interface{}{
				"binance_bid": binanceBid,
				"binance_ask": binanceAsk,
				"kucoin_bid":  kuCoinBid,
				"kucoin_ask":  kuCoinAsk,
				"real_profit": realProfit,
				"action":      action,
				"timestamp":   time.Now(),
			}

			websocket.Broadcast(LatestResult)

			time.Sleep(2 * time.Second)
		}
	}()
}
