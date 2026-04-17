package handler

import (
	"crypto-arbitrage/internal/exchange"
	"crypto-arbitrage/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetBinancePrice(ctx *gin.Context) {
	bid, ask, err := exchange.GetBinanceBTCPrice()
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
	bid, ask, err := exchange.GetKuCoinBTCPrice()
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
