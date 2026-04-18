package handler

import (
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetBinancePrice(ctx *gin.Context) {

	symbol := ctx.Query("symbol")
	if symbol == "" {
		symbol = "BTCUSDT"
	}

	bid, ask, err := exchange.GetBinancePrice(symbol)
	if err != nil {
		ctx.JSON(500, gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx.JSON(200, gin.H{
		"bid_price": bid,
		"ask_price": ask,
	})
}

func GetKucoinPrice(ctx *gin.Context) {

	symbol := ctx.Query("symbol")
	if symbol == "" {
		symbol = "BTCUSDT"
	}

	bid, ask, err := exchange.GetKuCoinPrice(symbol)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"bid_price": bid,
		"ask_price": ask,
	})
}

func ComparePrice(ctx *gin.Context) {

	if service.LatestResult == nil {
		ctx.JSON(200, gin.H{
			"message": "Scanner warming up...",
		})
		return
	}

	ctx.JSON(200, service.LatestResult)
}
