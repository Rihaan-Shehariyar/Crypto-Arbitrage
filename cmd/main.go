package main

import (
	"crypto-arbitrage/internal/handler"
	"crypto-arbitrage/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	service.StartScanner()

	r.GET("/price/binance", handler.GetBinancePrice)
	r.GET("/price/kuCoin", handler.GetKucoinPrice)

	r.GET("/compare", handler.ComparePrice)
	r.GET("/ws", handler.HandleWebSocket)

	r.Run(":8080")

}
