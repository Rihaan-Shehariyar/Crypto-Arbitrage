package handler

import (
	"crypto-arbitrage/internal/exchange"
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

	type BinanceResult struct {
		bid float64
		ask float64
		err error
	}

	type KucoinResult struct {
		bid float64
		ask float64
		err error
	}

	binanceChan := make(chan BinanceResult)
	kuCoinChan := make(chan KucoinResult)

	go func() {
		bid, ask, err := exchange.GetBinanceBTCPrice()
		binanceChan <- BinanceResult{bid, ask, err}
	}()

	go func() {
		bid, ask, err := exchange.GetKuCoinBTCPrice()
		kuCoinChan <- KucoinResult{bid, ask, err}
	}()

	binanceRes := <-binanceChan
	kuCoinRes := <-kuCoinChan

	if binanceRes.err != nil {
		ctx.JSON(500, gin.H{"error": binanceRes.err.Error()})
	}

	if kuCoinRes.err != nil {
		ctx.JSON(500, gin.H{"error": kuCoinRes.err.Error()})
	}

	binanceBid := binanceRes.bid
	binanceAsk := binanceRes.ask
	kuCoinBid := binanceRes.ask
	kuCoinAsk := binanceRes.bid

	profit1 := kuCoinBid - binanceAsk
	fee1 := (binanceAsk * 0.001) + (kuCoinBid * 0.001)
	realProfit1 := profit1 - fee1

	profit2 := binanceBid - kuCoinAsk
	fee2 := (kuCoinAsk * 0.001) + (binanceBid * 0.001)
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

	ctx.JSON(200, gin.H{
		"binance_bid": binanceBid,
		"binance_ask": binanceAsk,
		"kucoin_bid":  kuCoinBid,
		"kucoin_ask":  kuCoinAsk,
		"real_profit": realProfit,
		"threshold":   threshold,
		"action":      action,
	})
}
