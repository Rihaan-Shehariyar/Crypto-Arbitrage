package main

import (
	"crypto-arbitrage/internal/exchange"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/price/binance", func(ctx *gin.Context) {
		price, err := exchange.GetBTCPrice()

		if err != nil {
			ctx.JSON(500, gin.H{
				"Err": err.Error(),
			})
			return
		}

		ctx.JSON(200, gin.H{
			"price": price,
		})

	})
	r.GET("/price/kuCoin", func(ctx *gin.Context) {
		price, err := exchange.GetKucoinBTCPrice()

		if err != nil {
			ctx.JSON(500, gin.H{
				"Err": err.Error(),
			})
			return
		}

		ctx.JSON(200, gin.H{
			"price": price,
		})

	})

	r.GET("/compare", func(ctx *gin.Context) {

		binancePrice, err := exchange.GetBTCPrice()
		if err != nil {
			ctx.JSON(500, gin.H{
				"error": err,
			})
			return
		}

		kuCoinPrice, err := exchange.GetKucoinBTCPrice()
		if err != nil {
			ctx.JSON(500, gin.H{
				"error": err,
			})
			return
		}

		var action string
		var profit float64

		if binancePrice < kuCoinPrice {
			profit = kuCoinPrice - binancePrice
			action = "Buy Binance → Sell KuCoin"
		} else {
			profit = binancePrice - kuCoinPrice
			action = "Buy KuCoin → Sell Binance"
		}

		ctx.JSON(200, gin.H{
			"binance": binancePrice,
			"kuCoin":  kuCoinPrice,
			"profit":  profit,
			"action":  action,
		})

	})

	r.Run(":8080")

}
