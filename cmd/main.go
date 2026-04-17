package main

import (
	"crypto-arbitrage/internal/exchange"
	"net/http"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/price/binance", func(ctx *gin.Context) {
		binanceBid, binanceAsk, err := exchange.GetBinanceBTCPrice()

		if err != nil {
			ctx.JSON(500, gin.H{
				"Err": err.Error(),
			})
			return
		}

		ctx.JSON(200, gin.H{
			"Ask Price": binanceAsk,
			"Bid Price": binanceBid,
		})

	})
	r.GET("/price/kuCoin", func(ctx *gin.Context) {
		kucoinBid, kucoinAsk, err := exchange.GetKuCoinBTCPrice()
		if err != nil {
			ctx.JSON(500, gin.H{
				"Err": err.Error(),
			})
			return
		}

		ctx.JSON(200, gin.H{
			"Ask Price": kucoinAsk,
			"Bid Price": kucoinBid,
		})

	})

	r.GET("/compare", func(ctx *gin.Context) {

		binanceBid, binanceAsk, err := exchange.GetBinanceBTCPrice()
		if err != nil {
			ctx.JSON(500, gin.H{
				"error": err.Error(),
			})
			return
		}

		kucoinBid, kucoinAsk, err := exchange.GetKuCoinBTCPrice()
		if err != nil {
			ctx.JSON(500, gin.H{
				"error": err.Error(),
			})
			return
		}

		profit1 := kucoinBid - binanceAsk
		fee1 := (binanceAsk * 0.001) + (kucoinBid * 0.001)
		realProfit1 := profit1 - fee1

		profit2 := binanceBid - kucoinAsk
		fee2 := (kucoinAsk * 0.001) + (binanceBid * 0.001)
		realProfit2 := profit2 - fee2

		var action string
		var realProfit float64
		threshold := 50.0

		if realProfit1 > realProfit2 {
			realProfit = realProfit1
			if realProfit >= threshold {
				action = "Buy Binance → Sell KuCoin"
			}
		} else {
			realProfit = realProfit2
			if realProfit >= threshold {
				action = "Buy KuCoin → Sell Binance"
			}
		}

		if realProfit < threshold {
			action = "No profitable arbitrage"
		}

		ctx.JSON(http.StatusOK, gin.H{
			"binance_bid": binanceBid,
			"binance_ask": binanceAsk,
			"kucoin_bid":  kucoinBid,
			"kucoin_ask":  kucoinAsk,

			"profit_case1": profit1,
			"profit_case2": profit2,
			"fee_case1":    fee1,
			"fee_case2":    fee2,

			"real_profit": realProfit,
			"threshold":   threshold,
			"action":      action,
		})
	})

	r.Run(":8080")

}
