package main

import (
	"crypto-arbitrage/internal/exchange"

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

		var action string
		var profit float64

		profit1 := kucoinBid - binanceAsk

		profit2 := binanceBid - kucoinAsk

		if profit1 > profit2 {
			profit = profit1
			action = "Buy Binance (ASK) → Sell KuCoin (BID)"
		} else {
			profit = profit2
			action = "Buy KuCoin (ASK) → Sell Binance (BID)"
		}

		ctx.JSON(200, gin.H{
			"binance_bid": binanceBid,
			"binance_ask": binanceAsk,
			"kucoin_bid":  kucoinBid,
			"kucoin_ask":  kucoinAsk,
			"profit":      profit,
			"action":      action,
		})

	})

	r.Run(":8080")

}
