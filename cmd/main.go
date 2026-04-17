package main

import (
	"crypto-arbitrage/internal/handler"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/price/binance", handler.GetBinancePrice)
	r.GET("/price/kuCoin", handler.GetKucoinPrice)

	r.GET("/compare", handler.ComparePrice)

	r.Run(":8080")

}
