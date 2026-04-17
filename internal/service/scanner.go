package service

import (
	"crypto-arbitrage/internal/exchange"
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

			var bestProfit float64

			if profit1 > profit2 {
				bestProfit = profit1
			} else {
				bestProfit = profit2
			}

			LatestResult = map[string]interface{}{
				"binance_bid": binanceBid,
				"binance_ask": binanceAsk,
				"kucoin_bid":  kuCoinBid,
				"kucoin_ask":  kuCoinAsk,
				"profit":      bestProfit,
				"timestamp":   time.Now(),
			}

			time.Sleep(2 * time.Second)
		}

	}()

}
