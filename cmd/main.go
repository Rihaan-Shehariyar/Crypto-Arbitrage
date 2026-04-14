package main

import (
	"crypto-arbitrage/internal/exchange"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/price", func(ctx *gin.Context) {
		price, err := exchange.GetBTCprice()

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

	r.Run(":8080")

}
